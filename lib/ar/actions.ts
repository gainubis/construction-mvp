"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ARPlanFormState, ARMarkerType } from "@/lib/projects/types";
import { getCurrentUser } from "@/lib/auth/session";
import { buildArWallPhotoPath, AR_WALL_PHOTOS_BUCKET } from "@/lib/ar/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isArMarkerType } from "@/lib/ar/validation";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function buildFieldError(message: string) {
  return {
    error: message,
    fieldErrors: {},
  } satisfies ARPlanFormState;
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

function parseMarkers(rawValue: string) {
  if (!rawValue) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const markers: Array<{
    id: string;
    marker_type: ARMarkerType;
    x_percent: number;
    y_percent: number;
    label: string | null;
    notes: string | null;
    sort_order: number;
  }> = [];

  for (const [index, item] of parsed.entries()) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const markerType = String(candidate.markerType ?? candidate.marker_type ?? "");
    const xPercent = Number(candidate.xPercent ?? candidate.x_percent);
    const yPercent = Number(candidate.yPercent ?? candidate.y_percent);
    const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
    const notes = typeof candidate.notes === "string" ? candidate.notes.trim() : "";
    const id = typeof candidate.id === "string" && candidate.id.length > 0 ? candidate.id : randomUUID();

    if (!isArMarkerType(markerType) || Number.isNaN(xPercent) || Number.isNaN(yPercent)) {
      return null;
    }

    markers.push({
      id,
      marker_type: markerType as ARMarkerType,
      x_percent: Math.max(0, Math.min(100, xPercent)),
      y_percent: Math.max(0, Math.min(100, yPercent)),
      label: label || null,
      notes: notes || null,
      sort_order: Number.isFinite(Number(candidate.sortOrder ?? candidate.sort_order))
        ? Number(candidate.sortOrder ?? candidate.sort_order)
        : index + 1,
    });
  }

  return markers;
}

async function cleanupUploadedPhoto(supabase: SupabaseClient, storagePath: string | null) {
  if (storagePath) {
    await supabase.storage.from(AR_WALL_PHOTOS_BUCKET).remove([storagePath]);
  }
}

async function uploadWallPhoto(
  supabase: SupabaseClient,
  projectId: string,
  planId: string,
  file: File,
) {
  const storagePath = buildArWallPhotoPath(projectId, planId, file.name);
  const { error } = await supabase.storage.from(AR_WALL_PHOTOS_BUCKET).upload(storagePath, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    return { error: error.message, storagePath: null };
  }

  return { error: null as string | null, storagePath };
}

export async function saveArPlanAction(
  _: ARPlanFormState,
  formData: FormData,
): Promise<ARPlanFormState> {
  const projectId = getStringValue(formData, "projectId");
  const planId = getStringValue(formData, "planId") || null;
  const stageId = getStringValue(formData, "stageId") || null;
  const title = getStringValue(formData, "title");
  const notes = getStringValue(formData, "notes") || null;
  const markersRaw = getStringValue(formData, "markersJson");
  const wallPhoto = getFileValue(formData, "wallPhoto");

  if (!projectId) {
    return buildFieldError("Project context is missing.");
  }

  if (!title) {
    return {
      error: "Enter a wall plan title.",
      fieldErrors: {
        title: "Enter a wall plan title.",
      },
    };
  }

  const markers = parseMarkers(markersRaw);
  if (!markers) {
    return {
      error: "Marker data could not be saved. Please try again.",
      fieldErrors: {
        markersJson: "Marker data could not be saved.",
      },
    };
  }

  const context = await requireContext();
  if (!context) {
    return buildFieldError("Sign in to save AR wall plans.");
  }

  const { supabase, currentUser } = context;

  const { data: existingPlan } = planId
    ? await supabase
        .from("ar_plans")
        .select("id, project_id, wall_photo_path")
        .eq("id", planId)
        .eq("project_id", projectId)
        .maybeSingle()
    : { data: null };

  if (planId && !existingPlan) {
    return buildFieldError("AR wall plan not found.");
  }

  const effectivePlanId = planId ?? randomUUID();

  let wallPhotoPath = existingPlan?.wall_photo_path ?? null;
  let uploadedPhotoPath: string | null = null;

  if (!wallPhotoPath && !wallPhoto) {
    return {
      error: "Upload a wall photo to start a plan.",
      fieldErrors: {
        wallPhoto: "Upload a wall photo to start a plan.",
      },
    };
  }

  if (wallPhoto) {
    const uploadResult = await uploadWallPhoto(supabase, projectId, effectivePlanId, wallPhoto);
    if (uploadResult.error) {
      return {
        error: `Photo upload failed: ${uploadResult.error}`,
        fieldErrors: {
          wallPhoto: uploadResult.error,
        },
      };
    }

    uploadedPhotoPath = uploadResult.storagePath;
    wallPhotoPath = uploadResult.storagePath;
  }

  const { data: savedPlanId, error } = await supabase.rpc("save_ar_plan_with_markers", {
    p_plan_id: planId,
    p_project_id: projectId,
    p_stage_id: stageId || null,
    p_uploaded_by: currentUser.id,
    p_title: title,
    p_wall_photo_path: wallPhotoPath,
    p_notes: notes,
    p_markers: markers,
  });

  if (error) {
    await cleanupUploadedPhoto(supabase, uploadedPhotoPath);
    return {
      error: error.message,
      fieldErrors: {},
    };
  }

  if (existingPlan?.wall_photo_path && uploadedPhotoPath && existingPlan.wall_photo_path !== uploadedPhotoPath) {
    await supabase.storage.from(AR_WALL_PHOTOS_BUCKET).remove([existingPlan.wall_photo_path]);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/ar`);

  const nextPlanId = typeof savedPlanId === "string" ? savedPlanId : effectivePlanId;
  redirect(`/projects/${projectId}/ar?plan=${nextPlanId}${planId ? "&updated=1" : "&created=1"}`);
}
