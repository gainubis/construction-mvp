"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { StageFormField, StageFormState, StageStatus } from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStageProgressForStatus, getMissingStageFieldMessage, isStageStatus, validateStageSequence } from "@/lib/stages/validation";

const DEFAULT_STATE: StageFormState = {
  error: null,
  fieldErrors: {},
};

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addFieldError(
  fieldErrors: Partial<Record<StageFormField, string>>,
  field: StageFormField,
  message: string,
) {
  fieldErrors[field] = message;
}

function getStageProgress(status: StageStatus) {
  return getStageProgressForStatus(status);
}

async function loadProjectMemberIds(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select("profile_id")
    .eq("project_id", projectId);

  if (error || !data) {
    return null;
  }

  return data.map((member) => member.profile_id);
}

function currentDateIso() {
  return new Date().toISOString();
}

export async function createStageAction(
  _: StageFormState,
  formData: FormData,
): Promise<StageFormState> {
  const fieldErrors: Partial<Record<StageFormField, string>> = {};

  const projectId = getStringValue(formData, "projectId");
  const name = getStringValue(formData, "name");
  const description = getStringValue(formData, "description");
  const sequenceValue = getStringValue(formData, "sequence");
  const deadline = getStringValue(formData, "deadline");
  const responsibleProfileId = getStringValue(formData, "responsibleProfileId");
  const statusValue = getStringValue(formData, "status");

  if (!projectId) {
    return {
      error: "Project context is missing.",
      fieldErrors,
    };
  }

  if (!name) {
    addFieldError(fieldErrors, "name", getMissingStageFieldMessage("name"));
  }

  if (!description) {
    addFieldError(fieldErrors, "description", getMissingStageFieldMessage("description"));
  }

  if (!sequenceValue) {
    addFieldError(fieldErrors, "sequence", getMissingStageFieldMessage("sequence"));
  } else {
    const sequenceError = validateStageSequence(sequenceValue);
    if (sequenceError) {
      addFieldError(fieldErrors, "sequence", sequenceError);
    }
  }

  if (!deadline) {
    addFieldError(fieldErrors, "deadline", getMissingStageFieldMessage("deadline"));
  }

  if (!responsibleProfileId) {
    addFieldError(fieldErrors, "responsibleProfileId", getMissingStageFieldMessage("responsibleProfileId"));
  }

  if (!isStageStatus(statusValue)) {
    addFieldError(fieldErrors, "status", getMissingStageFieldMessage("status"));
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ...DEFAULT_STATE,
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: "Supabase is not configured.",
      fieldErrors,
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      error: "You must be signed in to create a stage.",
      fieldErrors,
    };
  }

  const memberIds = await loadProjectMemberIds(supabase, projectId);
  if (!memberIds || memberIds.length === 0) {
    return {
      error: "Could not load project members.",
      fieldErrors,
    };
  }

  if (!memberIds.includes(responsibleProfileId)) {
    return {
      error: "Responsible user must belong to the project team.",
      fieldErrors,
    };
  }

  const sequence = Number(sequenceValue);
  const status = statusValue as StageStatus;
  const progressPercent = getStageProgress(status);

  const { data: stage, error } = await supabase
    .from("stages")
    .insert({
      id: randomUUID(),
      project_id: projectId,
      name,
      notes: description,
      sequence,
      status,
      progress_percent: progressPercent,
      planned_end_date: deadline,
      responsible_profile_id: responsibleProfileId,
      actual_start_date: status === "planned" ? null : currentDateIso(),
      actual_end_date: status === "complete" ? currentDateIso() : null,
    })
    .select("id")
    .maybeSingle();

  if (error || !stage) {
    return {
      error: error?.message ?? "Stage creation failed.",
      fieldErrors,
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stage.id}`);

  redirect(`/projects/${projectId}/stages/${stage.id}?created=1`);
}

export async function updateStageAction(
  _: StageFormState,
  formData: FormData,
): Promise<StageFormState> {
  const fieldErrors: Partial<Record<StageFormField, string>> = {};

  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const name = getStringValue(formData, "name");
  const description = getStringValue(formData, "description");
  const sequenceValue = getStringValue(formData, "sequence");
  const deadline = getStringValue(formData, "deadline");
  const responsibleProfileId = getStringValue(formData, "responsibleProfileId");
  const statusValue = getStringValue(formData, "status");

  if (!projectId || !stageId) {
    return {
      error: "Stage context is missing.",
      fieldErrors,
    };
  }

  if (!name) {
    addFieldError(fieldErrors, "name", getMissingStageFieldMessage("name"));
  }

  if (!description) {
    addFieldError(fieldErrors, "description", getMissingStageFieldMessage("description"));
  }

  if (!sequenceValue) {
    addFieldError(fieldErrors, "sequence", getMissingStageFieldMessage("sequence"));
  } else {
    const sequenceError = validateStageSequence(sequenceValue);
    if (sequenceError) {
      addFieldError(fieldErrors, "sequence", sequenceError);
    }
  }

  if (!deadline) {
    addFieldError(fieldErrors, "deadline", getMissingStageFieldMessage("deadline"));
  }

  if (!responsibleProfileId) {
    addFieldError(fieldErrors, "responsibleProfileId", getMissingStageFieldMessage("responsibleProfileId"));
  }

  if (!isStageStatus(statusValue)) {
    addFieldError(fieldErrors, "status", getMissingStageFieldMessage("status"));
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ...DEFAULT_STATE,
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: "Supabase is not configured.",
      fieldErrors,
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      error: "You must be signed in to update a stage.",
      fieldErrors,
    };
  }

  const memberIds = await loadProjectMemberIds(supabase, projectId);
  if (!memberIds || memberIds.length === 0) {
    return {
      error: "Could not load project members.",
      fieldErrors,
    };
  }

  if (!memberIds.includes(responsibleProfileId)) {
    return {
      error: "Responsible user must belong to the project team.",
      fieldErrors,
    };
  }

  const sequence = Number(sequenceValue);
  const status = statusValue as StageStatus;
  const progressPercent = getStageProgress(status);

  const { error } = await supabase
    .from("stages")
    .update({
      name,
      notes: description,
      sequence,
      status,
      progress_percent: progressPercent,
      planned_end_date: deadline,
      responsible_profile_id: responsibleProfileId,
      actual_start_date: status === "planned" ? null : currentDateIso(),
      actual_end_date: status === "complete" ? currentDateIso() : null,
    })
    .eq("project_id", projectId)
    .eq("id", stageId);

  if (error) {
    return {
      error: error.message,
      fieldErrors,
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);

  redirect(`/projects/${projectId}/stages/${stageId}?updated=1`);
}

export async function deleteStageAction(_: StageFormState, formData: FormData): Promise<StageFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");

  if (!projectId || !stageId) {
    return {
      error: "Stage context is missing.",
      fieldErrors: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: "Supabase is not configured.",
      fieldErrors: {},
    };
  }

  const { data: stage } = await supabase
    .from("stages")
    .select("id, checklist_id")
    .eq("project_id", projectId)
    .eq("id", stageId)
    .maybeSingle();

  if (!stage) {
    return {
      error: "Stage not found.",
      fieldErrors: {},
    };
  }

  const checklistId = stage.checklist_id;

  const { data: reports } = await supabase.from("stage_reports").select("id").eq("stage_id", stageId);
  const reportIds = (reports ?? []).map((report) => report.id);

  const { data: acts } = await supabase.from("acts").select("id").eq("stage_id", stageId);
  const actIds = (acts ?? []).map((act) => act.id);

  const { data: arPlans } = await supabase.from("ar_plans").select("id").eq("stage_id", stageId);
  const arPlanIds = (arPlans ?? []).map((plan) => plan.id);

  const { data: safetyViolations } = await supabase
    .from("safety_violations")
    .select("id")
    .eq("stage_id", stageId);
  const safetyViolationIds = (safetyViolations ?? []).map((violation) => violation.id);

  if (reportIds.length > 0) {
    await supabase.from("notifications").delete().eq("stage_id", stageId);
    await supabase.from("notifications").delete().in("report_id", reportIds);
    await supabase.from("report_photos").delete().in("report_id", reportIds);
    await supabase.from("stage_reports").delete().eq("stage_id", stageId);
  }

  if (actIds.length > 0) {
    await supabase.from("notifications").delete().in("act_id", actIds);
    await supabase.from("acts").delete().eq("stage_id", stageId);
  }

  if (arPlanIds.length > 0) {
    await supabase.from("ar_markers").delete().in("ar_plan_id", arPlanIds);
    await supabase.from("ar_plans").delete().eq("stage_id", stageId);
  }

  await supabase.from("notifications").delete().eq("stage_id", stageId);
  if (safetyViolationIds.length > 0) {
    await supabase.from("notifications").delete().in("violation_id", safetyViolationIds);
    await supabase.from("safety_violation_photos").delete().in("violation_id", safetyViolationIds);
  }
  await supabase.from("safety_violations").delete().eq("stage_id", stageId);

  if (checklistId) {
    await supabase.from("checklist_items").delete().eq("checklist_id", checklistId);
    await supabase.from("checklists").delete().eq("id", checklistId);
  }

  const { error } = await supabase.from("stages").delete().eq("project_id", projectId).eq("id", stageId);

  if (error) {
    return {
      error: error.message,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);

  redirect(`/projects/${projectId}?stageDeleted=1`);
}
