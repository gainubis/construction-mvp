"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type {
  ChecklistFormState,
  ChecklistItemFormState,
  InspectionFormState,
  InspectionResultValue,
} from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAndStoreInspectionSummary } from "@/lib/ai/inspection-summary";
import {
  buildInspectionPhotoPath,
  INSPECTION_PHOTO_BUCKET,
} from "@/lib/stages/storage";
import {
  isChecklistItemType,
  isInspectionResult,
} from "@/lib/stages/validation";

const checklistDefaults: ChecklistFormState = {
  error: null,
  fieldErrors: {},
};

const checklistItemDefaults: ChecklistItemFormState = {
  error: null,
  fieldErrors: {},
};

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireSupabase() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  return { supabase, currentUser };
}

async function loadChecklistContext(supabase: SupabaseClient, projectId: string, stageId: string) {
  const { data: stage, error } = await supabase
    .from("stages")
    .select("id, project_id, checklist_id, progress_percent, name")
    .eq("project_id", projectId)
    .eq("id", stageId)
    .maybeSingle();

  if (error || !stage) {
    return null;
  }

  let checklistItems: Array<{
    id: string;
    checklist_id: string;
    sort_order: number;
    title: string;
    description: string | null;
    item_type: "boolean" | "text" | "number" | "photo";
    expected_value: string | null;
    is_required: boolean;
    created_at: string;
    updated_at: string;
  }> = [];

  if (stage.checklist_id) {
    const { data } = await supabase
      .from("checklist_items")
      .select("id, checklist_id, sort_order, title, description, item_type, expected_value, is_required, created_at, updated_at")
      .eq("checklist_id", stage.checklist_id)
      .order("sort_order", { ascending: true });

    checklistItems = data ?? [];
  }

  return { stage, checklistItems };
}

function requireInspectionResult(value: string): InspectionResultValue | null {
  if (isInspectionResult(value)) {
    return value as InspectionResultValue;
  }

  return null;
}

async function cleanupInspectionArtifacts(
  supabase: SupabaseClient,
  reportId: string,
  uploadedPaths: string[],
) {
  if (uploadedPaths.length > 0) {
    await supabase.storage.from(INSPECTION_PHOTO_BUCKET).remove(uploadedPaths);
  }

  await supabase.from("inspection_item_results").delete().eq("report_id", reportId);
  await supabase.from("report_photos").delete().eq("report_id", reportId);
  await supabase.from("stage_reports").delete().eq("id", reportId);
}

export async function createChecklistAction(
  _: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const name = getStringValue(formData, "name");
  const description = getStringValue(formData, "description");

  if (!projectId || !stageId) {
    return {
      error: "Stage context is missing.",
      fieldErrors: {},
    };
  }

  if (!name) {
    return {
      ...checklistDefaults,
      fieldErrors: { name: "Checklist name is required." },
    };
  }

  const context = await requireSupabase();
  if (!context) {
    return {
      error: "Sign in to manage checklists.",
      fieldErrors: {},
    };
  }

  const { supabase, currentUser } = context;

  const { data: checklist, error: checklistError } = await supabase
    .from("checklists")
    .insert({
      id: randomUUID(),
      project_id: projectId,
      name,
      description: description || null,
      created_by: currentUser.currentUser.id,
    })
    .select("id")
    .maybeSingle();

  if (checklistError || !checklist) {
    return {
      error: checklistError?.message ?? "Checklist could not be created.",
      fieldErrors: {},
    };
  }

  const { error: stageError } = await supabase
    .from("stages")
    .update({ checklist_id: checklist.id })
    .eq("project_id", projectId)
    .eq("id", stageId);

  if (stageError) {
    return {
      error: stageError.message,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);

  redirect(`/projects/${projectId}/stages/${stageId}?checklistCreated=1`);
}

export async function addChecklistItemAction(
  _: ChecklistItemFormState,
  formData: FormData,
): Promise<ChecklistItemFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const checklistId = getStringValue(formData, "checklistId");
  const title = getStringValue(formData, "title");
  const description = getStringValue(formData, "description");
  const itemType = getStringValue(formData, "itemType");
  const expectedValue = getStringValue(formData, "expectedValue");
  const isRequired = formData.get("isRequired") === "on";

  if (!projectId || !stageId || !checklistId) {
    return {
      error: "Checklist context is missing.",
      fieldErrors: {},
    };
  }

  if (!title) {
    return {
      ...checklistItemDefaults,
      fieldErrors: { title: "Checklist item title is required." },
    };
  }

  if (!isChecklistItemType(itemType)) {
    return {
      ...checklistItemDefaults,
      fieldErrors: { itemType: "Choose a valid item type." },
    };
  }

  const context = await requireSupabase();
  if (!context) {
    return {
      error: "Sign in to manage checklist items.",
      fieldErrors: {},
    };
  }

  const { supabase } = context;

  const { data: existingItems } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existingItems?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("checklist_items").insert({
    id: randomUUID(),
    checklist_id: checklistId,
    sort_order: nextSortOrder,
    title,
    description: description || null,
    item_type: itemType as "boolean" | "text" | "number" | "photo",
    expected_value: expectedValue || null,
    is_required: isRequired,
  });

  if (error) {
    return {
      error: error.message,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);

  redirect(`/projects/${projectId}/stages/${stageId}?checklistItemCreated=1`);
}

export async function deleteChecklistItemAction(
  _: ChecklistItemFormState,
  formData: FormData,
): Promise<ChecklistItemFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const itemId = getStringValue(formData, "itemId");

  if (!projectId || !stageId || !itemId) {
    return {
      error: "Checklist item context is missing.",
      fieldErrors: {},
    };
  }

  const context = await requireSupabase();
  if (!context) {
    return {
      error: "Sign in to manage checklist items.",
      fieldErrors: {},
    };
  }

  const { supabase } = context;

  const { error } = await supabase.from("checklist_items").delete().eq("id", itemId);

  if (error) {
    return {
      error: error.message,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);

  redirect(`/projects/${projectId}/stages/${stageId}?checklistItemDeleted=1`);
}

export async function submitInspectionAction(
  _: InspectionFormState,
  formData: FormData,
): Promise<InspectionFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const inspectorComments = getStringValue(formData, "inspectorComments");
  const photoFiles = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const itemErrors: Record<string, string> = {};
  const fieldErrors: InspectionFormState["fieldErrors"] = {};

  if (!projectId || !stageId) {
    return {
      error: "Stage context is missing.",
      fieldErrors,
      itemErrors,
    };
  }

  if (!inspectorComments) {
    fieldErrors.inspectorComments = "Add inspector comments before submitting.";
  }

  if (photoFiles.length === 0) {
    fieldErrors.photos = "Upload at least one inspection photo.";
  }

  const context = await requireSupabase();
  if (!context) {
    return {
      error: "Sign in to submit an inspection.",
      fieldErrors,
      itemErrors,
    };
  }

  const { supabase, currentUser } = context;
  const checklistContext = await loadChecklistContext(supabase, projectId, stageId);

  if (!checklistContext || !checklistContext.stage.checklist_id) {
    return {
      error: "Attach a checklist to the stage before starting an inspection.",
      fieldErrors,
      itemErrors,
    };
  }

  if (checklistContext.checklistItems.length === 0) {
    return {
      error: "Add checklist items before submitting an inspection.",
      fieldErrors,
      itemErrors,
    };
  }

  checklistContext.checklistItems.forEach((item) => {
    const resultKey = `result_${item.id}`;
    const resultValue = getStringValue(formData, resultKey);

    if (!requireInspectionResult(resultValue)) {
      itemErrors[item.id] = "Choose pass, fail, or not applicable.";
    }
  });

  if (Object.keys(fieldErrors).length > 0 || Object.keys(itemErrors).length > 0) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
      itemErrors,
    };
  }

  const reportId = randomUUID();
  const reportDate = new Date().toISOString().slice(0, 10);
  const uploadedPaths: string[] = [];
  const passedCount = checklistContext.checklistItems.filter((item) => {
    const value = getStringValue(formData, `result_${item.id}`);
    return value === "passed";
  }).length;
  const healthScore = Math.max(40, Math.round((passedCount / checklistContext.checklistItems.length) * 100));

  const { error: reportError } = await supabase.from("stage_reports").insert({
    id: reportId,
    stage_id: stageId,
    checklist_id: checklistContext.stage.checklist_id,
    reported_by: currentUser.currentUser.id,
    report_date: reportDate,
    status: "submitted",
    summary: "Daily inspection submitted",
    inspector_comments: inspectorComments,
    issues: null,
    recommendations: null,
    health_score: healthScore,
    progress_before: checklistContext.stage.progress_percent,
    progress_after: checklistContext.stage.progress_percent,
  });

  if (reportError) {
    return {
      error: reportError.message,
      fieldErrors,
      itemErrors,
    };
  }

  const photoRows: Array<{
    id: string;
    report_id: string;
    storage_path: string;
    caption: string | null;
    sort_order: number;
  }> = [];

  for (let index = 0; index < photoFiles.length; index += 1) {
    const file = photoFiles[index];
    const storagePath = buildInspectionPhotoPath(stageId, reportId, file.name);
    const { error: uploadError } = await supabase.storage
      .from(INSPECTION_PHOTO_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      await cleanupInspectionArtifacts(supabase, reportId, uploadedPaths);
      return {
        error: `Photo upload failed: ${uploadError.message}`,
        fieldErrors,
        itemErrors,
      };
    }

    uploadedPaths.push(storagePath);
    photoRows.push({
      id: randomUUID(),
      report_id: reportId,
      storage_path: storagePath,
      caption: file.name,
      sort_order: index + 1,
    });
  }

  if (photoRows.length > 0) {
    const { error: photoInsertError } = await supabase.from("report_photos").insert(photoRows);
    if (photoInsertError) {
      await cleanupInspectionArtifacts(supabase, reportId, uploadedPaths);
      return {
        error: photoInsertError.message,
        fieldErrors,
        itemErrors,
      };
    }
  }

  const inspectionRows = checklistContext.checklistItems.map((item) => ({
    id: randomUUID(),
    report_id: reportId,
    checklist_item_id: item.id,
    result: getStringValue(formData, `result_${item.id}`) as InspectionResultValue,
    comment: getStringValue(formData, `comment_${item.id}`) || null,
  }));

  const { error: inspectionError } = await supabase.from("inspection_item_results").insert(inspectionRows);
  if (inspectionError) {
    await cleanupInspectionArtifacts(supabase, reportId, uploadedPaths);
    return {
      error: inspectionError.message,
      fieldErrors,
      itemErrors,
    };
  }

  const aiSummaryResult = await generateAndStoreInspectionSummary(reportId, {
    supabase,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);
  revalidatePath(`/projects/${projectId}/reports`);
  revalidatePath(`/projects/${projectId}/reports/${reportId}`);

  const query = aiSummaryResult.ok ? "inspectionSubmitted=1" : "inspectionSubmitted=1&aiSummaryFailed=1";
  redirect(`/projects/${projectId}/stages/${stageId}?${query}`);
}
