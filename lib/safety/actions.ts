"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/auth/types";
import type { SafetyFormState, SafetySeverity, SafetyStatus, SafetyViolationType } from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSafetyEvidencePath, SAFETY_EVIDENCE_BUCKET } from "@/lib/safety/storage";
import {
  getSafetyFormFieldMessage,
  getSafetyViolationLabel,
  isSafetySeverity,
  isSafetyStatus,
  isSafetyViolationType,
} from "@/lib/safety/validation";

const INITIAL_STATE: SafetyFormState = {
  error: null,
  fieldErrors: {},
};

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function requireContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const session = await getCurrentUser();
  if (!session) {
    return null;
  }

  return { supabase, currentUser: session.currentUser };
}

async function getForemanRecipientIds(
  supabase: SupabaseClient,
  projectId: string,
  currentUser: CurrentUser,
) {
  const { data } = await supabase
    .from("project_members")
    .select("profile_id, role")
    .eq("project_id", projectId)
    .eq("role", "foreman");

  const projectForemen = (data ?? []).map((item) => item.profile_id);

  if (projectForemen.length > 0) {
    return projectForemen;
  }

  return currentUser.role === "foreman" ? [currentUser.id] : [];
}

async function uploadSafetyEvidence(
  supabase: SupabaseClient,
  projectId: string,
  violationId: string,
  files: File[],
) {
  const uploadedPaths: string[] = [];
  const photoRows: Array<{
    id: string;
    violation_id: string;
    storage_path: string;
    caption: string | null;
    sort_order: number;
  }> = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const storagePath = buildSafetyEvidencePath(projectId, violationId, file.name);
    const { error } = await supabase.storage.from(SAFETY_EVIDENCE_BUCKET).upload(storagePath, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    if (error) {
      return { error: error.message, uploadedPaths, photoRows };
    }

    uploadedPaths.push(storagePath);
    photoRows.push({
      id: randomUUID(),
      violation_id: violationId,
      storage_path: storagePath,
      caption: file.name,
      sort_order: index + 1,
    });
  }

  return { error: null as string | null, uploadedPaths, photoRows };
}

async function cleanupViolationArtifacts(
  supabase: SupabaseClient,
  uploadedPaths: string[],
  violationId: string,
) {
  if (uploadedPaths.length > 0) {
    await supabase.storage.from(SAFETY_EVIDENCE_BUCKET).remove(uploadedPaths);
  }

  await supabase.from("notifications").delete().eq("violation_id", violationId);
  await supabase.from("safety_violation_photos").delete().eq("violation_id", violationId);
  await supabase.from("safety_violations").delete().eq("id", violationId);
}

function buildTitle(violationType: SafetyViolationType, stageName?: string | null) {
  const base = getSafetyViolationLabel(violationType);
  return stageName ? `${base} - ${stageName}` : base;
}

function resolveResolvedAt(status: SafetyStatus) {
  return status === "resolved" ? new Date().toISOString() : null;
}

async function insertForemanNotifications(
  supabase: SupabaseClient,
  currentUser: CurrentUser,
  projectId: string,
  stageId: string | null,
  violationId: string,
  title: string,
  severity: SafetySeverity,
) {
  const { data: violation } = await supabase
    .from("safety_violations")
    .select("id, title, violation_type, severity, project_id, stage_id")
    .eq("id", violationId)
    .maybeSingle();

  if (!violation) {
    return { error: "Violation was not found after creation." };
  }

  const recipients = await getForemanRecipientIds(supabase, projectId, currentUser);
  const payload = recipients
    .filter(Boolean)
    .map((recipientId) => ({
      id: randomUUID(),
      recipient_id: recipientId,
      project_id: projectId,
      stage_id: stageId,
      violation_id: violationId,
      type: "safety" as const,
      title: `Safety issue reported: ${title}`,
      body: `${severity.toUpperCase()} priority issue logged by ${currentUser.fullName}. Review the safety feed and assign corrective action.`,
      is_read: false,
      read_at: null,
    }));

  if (payload.length > 0) {
    const { error } = await supabase.from("notifications").insert(payload);
    if (error) {
      return { error: error.message };
    }
  }

  return { error: null };
}

export async function createSafetyViolationAction(
  _: SafetyFormState,
  formData: FormData,
): Promise<SafetyFormState> {
  const fieldErrors: SafetyFormState["fieldErrors"] = {};

  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId") || null;
  const violationTypeValue = getStringValue(formData, "violationType");
  const severityValue = getStringValue(formData, "severity");
  const assignedTo = getStringValue(formData, "assignedTo");
  const details = getStringValue(formData, "details");
  const locationNote = getStringValue(formData, "locationNote") || null;
  const titleValue = getStringValue(formData, "title");
  const statusValue = getStringValue(formData, "status");
  const photoFiles = getFiles(formData, "photos");

  if (!projectId) {
    return { error: "Project context is missing.", fieldErrors };
  }

  if (!isSafetyViolationType(violationTypeValue)) {
    fieldErrors.violationType = getSafetyFormFieldMessage("violationType");
  }

  if (!isSafetySeverity(severityValue)) {
    fieldErrors.severity = getSafetyFormFieldMessage("severity");
  }

  if (!assignedTo) {
    fieldErrors.assignedTo = getSafetyFormFieldMessage("assignedTo");
  }

  if (!details) {
    fieldErrors.details = getSafetyFormFieldMessage("details");
  }

  if (photoFiles.length === 0) {
    fieldErrors.photos = getSafetyFormFieldMessage("photos");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ...INITIAL_STATE, fieldErrors };
  }

  const violationType = violationTypeValue as SafetyViolationType;
  const severity = severityValue as SafetySeverity;

  const context = await requireContext();
  if (!context) {
    return { error: "Sign in to log a safety violation.", fieldErrors };
  }

  const { supabase, currentUser } = context;

  const { data: stage } = stageId
    ? await supabase.from("stages").select("id, name, project_id").eq("project_id", projectId).eq("id", stageId).maybeSingle()
    : { data: null };

  if (stageId && !stage) {
    return { error: "Stage not found for this project.", fieldErrors };
  }

  const { data: assignedMember } = await supabase
    .from("project_members")
    .select("profile_id")
    .eq("project_id", projectId)
    .eq("profile_id", assignedTo)
    .maybeSingle();

  if (!assignedMember) {
    return {
      error: "Choose a worker who belongs to this project.",
      fieldErrors: {
        assignedTo: "Choose a worker who belongs to this project.",
      },
    };
  }

  const violationId = randomUUID();
  const title = titleValue || buildTitle(violationType, stage?.name ?? null);
  const occurredAt = new Date().toISOString();
  const status = (statusValue && isSafetyStatus(statusValue) ? statusValue : "open") as SafetyStatus;
  const resolvedAt = resolveResolvedAt(status);

  const { error: violationError } = await supabase.from("safety_violations").insert({
    id: violationId,
    project_id: projectId,
    stage_id: stage?.id ?? stageId,
    reported_by: currentUser.id,
    assigned_to: assignedTo,
    violation_type: violationType,
    severity,
    status,
    title,
    details,
    location_note: locationNote,
    occurred_at: occurredAt,
    resolved_at: resolvedAt,
  });

  if (violationError) {
    return { error: violationError.message, fieldErrors };
  }

  const { error: uploadError, uploadedPaths, photoRows } = await uploadSafetyEvidence(
    supabase,
    projectId,
    violationId,
    photoFiles,
  );

  if (uploadError) {
    await cleanupViolationArtifacts(supabase, uploadedPaths, violationId);
    return { error: `Photo upload failed: ${uploadError}`, fieldErrors };
  }

  if (photoRows.length > 0) {
    const { error: photoInsertError } = await supabase.from("safety_violation_photos").insert(photoRows);
    if (photoInsertError) {
      await cleanupViolationArtifacts(supabase, uploadedPaths, violationId);
      return { error: photoInsertError.message, fieldErrors };
    }
  }

  const notificationResult = await insertForemanNotifications(
    supabase,
    currentUser,
    projectId,
    stage?.id ?? stageId,
    violationId,
    title,
    severity,
  );

  if (notificationResult.error) {
    console.error("Failed to create safety notification", notificationResult.error);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/safety`);
  if (stageId) {
    revalidatePath(`/projects/${projectId}/stages/${stageId}`);
  }

  redirect(`/projects/${projectId}/safety/${violationId}?created=1`);
}

export async function updateSafetyViolationAction(
  _: SafetyFormState,
  formData: FormData,
): Promise<SafetyFormState> {
  const fieldErrors: SafetyFormState["fieldErrors"] = {};

  const projectId = getStringValue(formData, "projectId");
  const violationId = getStringValue(formData, "violationId");
  const stageId = getStringValue(formData, "stageId") || null;
  const violationTypeValue = getStringValue(formData, "violationType");
  const severityValue = getStringValue(formData, "severity");
  const assignedTo = getStringValue(formData, "assignedTo");
  const details = getStringValue(formData, "details");
  const locationNote = getStringValue(formData, "locationNote") || null;
  const titleValue = getStringValue(formData, "title");
  const statusValue = getStringValue(formData, "status");
  const photoFiles = getFiles(formData, "photos");

  if (!projectId || !violationId) {
    return { error: "Violation context is missing.", fieldErrors };
  }

  if (!isSafetyViolationType(violationTypeValue)) {
    fieldErrors.violationType = getSafetyFormFieldMessage("violationType");
  }

  if (!isSafetySeverity(severityValue)) {
    fieldErrors.severity = getSafetyFormFieldMessage("severity");
  }

  if (!assignedTo) {
    fieldErrors.assignedTo = getSafetyFormFieldMessage("assignedTo");
  }

  if (!details) {
    fieldErrors.details = getSafetyFormFieldMessage("details");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ...INITIAL_STATE, fieldErrors };
  }

  const violationType = violationTypeValue as SafetyViolationType;
  const severity = severityValue as SafetySeverity;

  const context = await requireContext();
  if (!context) {
    return { error: "Sign in to update a safety violation.", fieldErrors };
  }

  const { supabase } = context;
  const { data: existing } = await supabase
    .from("safety_violations")
    .select("id, project_id, stage_id, title")
    .eq("project_id", projectId)
    .eq("id", violationId)
    .maybeSingle();

  if (!existing) {
    return { error: "Violation not found.", fieldErrors };
  }

  const { data: assignedMember } = await supabase
    .from("project_members")
    .select("profile_id")
    .eq("project_id", projectId)
    .eq("profile_id", assignedTo)
    .maybeSingle();

  if (!assignedMember) {
    return {
      error: "Choose a worker who belongs to this project.",
      fieldErrors: {
        assignedTo: "Choose a worker who belongs to this project.",
      },
    };
  }

  const title = titleValue || buildTitle(violationType);
  const status = (statusValue && isSafetyStatus(statusValue) ? statusValue : "open") as SafetyStatus;
  const resolvedAt = resolveResolvedAt(status);

  const { error: updateError } = await supabase
    .from("safety_violations")
    .update({
      stage_id: stageId,
      assigned_to: assignedTo,
      violation_type: violationType,
      severity,
      status,
      title,
      details,
      location_note: locationNote,
      resolved_at: resolvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", violationId)
    .eq("project_id", projectId);

  if (updateError) {
    return { error: updateError.message, fieldErrors };
  }

  const { error: uploadError, uploadedPaths, photoRows } = await uploadSafetyEvidence(
    supabase,
    projectId,
    violationId,
    photoFiles,
  );

  if (uploadError) {
    await cleanupViolationArtifacts(supabase, uploadedPaths, violationId);
    return { error: `Photo upload failed: ${uploadError}`, fieldErrors };
  }

  if (photoRows.length > 0) {
    const { error: photoInsertError } = await supabase.from("safety_violation_photos").insert(photoRows);
    if (photoInsertError) {
      await cleanupViolationArtifacts(supabase, uploadedPaths, violationId);
      return { error: photoInsertError.message, fieldErrors };
    }
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/safety`);
  revalidatePath(`/projects/${projectId}/safety/${violationId}`);
  if (existing.stage_id) {
    revalidatePath(`/projects/${projectId}/stages/${existing.stage_id}`);
  }

  redirect(`/projects/${projectId}/safety/${violationId}?updated=1`);
}

export async function deleteSafetyViolationAction(
  _: SafetyFormState,
  formData: FormData,
): Promise<SafetyFormState> {
  const projectId = getStringValue(formData, "projectId");
  const violationId = getStringValue(formData, "violationId");

  if (!projectId || !violationId) {
    return {
      error: "Violation context is missing.",
      fieldErrors: {},
    };
  }

  const context = await requireContext();
  if (!context) {
    return {
      error: "Sign in to delete a safety violation.",
      fieldErrors: {},
    };
  }

  const { supabase } = context;

  const { data: existing } = await supabase
    .from("safety_violations")
    .select("id, stage_id")
    .eq("project_id", projectId)
    .eq("id", violationId)
    .maybeSingle();

  if (!existing) {
    return {
      error: "Violation not found.",
      fieldErrors: {},
    };
  }

  const { data: photos } = await supabase
    .from("safety_violation_photos")
    .select("storage_path")
    .eq("violation_id", violationId);

  if (photos?.length) {
    await supabase.storage.from(SAFETY_EVIDENCE_BUCKET).remove(photos.map((photo) => photo.storage_path));
  }

  await supabase.from("notifications").delete().eq("violation_id", violationId);
  await supabase.from("safety_violation_photos").delete().eq("violation_id", violationId);

  const { error } = await supabase.from("safety_violations").delete().eq("id", violationId).eq("project_id", projectId);

  if (error) {
    return {
      error: error.message,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/safety`);
  if (existing.stage_id) {
    revalidatePath(`/projects/${projectId}/stages/${existing.stage_id}`);
  }

  redirect(`/projects/${projectId}/safety?deleted=1`);
}
