"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FLOOR_PLAN_BUCKET, buildFloorPlanPath, getPublicFloorPlanUrl } from "@/lib/projects/storage";
import type { ProjectFormField, ProjectFormState, ProjectInsert } from "@/lib/projects/types";
import {
  getMissingFieldMessage,
  isProjectObjectType,
  validateProjectDateRange,
} from "@/lib/projects/validation";

const DEFAULT_STATE: ProjectFormState = {
  error: null,
  fieldErrors: {},
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addFieldError(
  fieldErrors: Partial<Record<ProjectFormField, string>>,
  field: ProjectFormField,
  message: string,
) {
  fieldErrors[field] = message;
}

function getNextProjectCode(name: string) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 8);

  return `PRJ-${slug || "NEW"}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createProjectAction(
  _: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const fieldErrors: Partial<Record<ProjectFormField, string>> = {};

  const name = getStringValue(formData, "name");
  const address = getStringValue(formData, "address");
  const clientName = getStringValue(formData, "clientName") || "Construction Client";
  const objectType = getStringValue(formData, "objectType");
  const startDate = getStringValue(formData, "startDate");
  const endDate = getStringValue(formData, "endDate");
  const description = getStringValue(formData, "description");
  const responsibleUsers = formData
    .getAll("responsibleUsers")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  const floorPlan = formData.get("floorPlan");

  if (!name) {
    addFieldError(fieldErrors, "name", getMissingFieldMessage("name"));
  }

  if (!address) {
    addFieldError(fieldErrors, "address", getMissingFieldMessage("address"));
  }

  if (!isProjectObjectType(objectType)) {
    addFieldError(fieldErrors, "objectType", getMissingFieldMessage("objectType"));
  }

  if (!startDate) {
    addFieldError(fieldErrors, "startDate", getMissingFieldMessage("startDate"));
  }

  if (!endDate) {
    addFieldError(fieldErrors, "endDate", getMissingFieldMessage("endDate"));
  }

  const dateError = validateProjectDateRange(startDate, endDate);
  if (dateError) {
    addFieldError(fieldErrors, "startDate", dateError);
    addFieldError(fieldErrors, "endDate", dateError);
  }

  if (responsibleUsers.length === 0) {
    addFieldError(fieldErrors, "responsibleUsers", getMissingFieldMessage("responsibleUsers"));
  }

  if (!(floorPlan instanceof File) || floorPlan.size === 0) {
    addFieldError(fieldErrors, "floorPlan", getMissingFieldMessage("floorPlan"));
  } else {
    const maxFileSize = 10 * 1024 * 1024;

    if (!floorPlan.type.startsWith("image/")) {
      addFieldError(fieldErrors, "floorPlan", "Floor plan must be an image file.");
    }

    if (floorPlan.size > maxFileSize) {
      addFieldError(fieldErrors, "floorPlan", "Floor plan must be 10 MB or smaller.");
    }
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
      error: "Supabase is not configured. Set the project URL and anon key first.",
      fieldErrors,
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      error: "You must be signed in to create a project.",
      fieldErrors,
    };
  }

  const projectId = randomUUID();
  if (!(floorPlan instanceof File)) {
    return {
      error: "Upload a valid floor plan image.",
      fieldErrors: {
        floorPlan: "Upload a valid floor plan image.",
      },
    };
  }

  const floorPlanPath = buildFloorPlanPath(projectId, floorPlan.name);

  const { error: uploadError } = await supabase.storage
    .from(FLOOR_PLAN_BUCKET)
    .upload(floorPlanPath, floorPlan, {
      upsert: false,
      contentType: floorPlan.type || "application/octet-stream",
    });

  if (uploadError) {
    return {
      error: `Floor plan upload failed: ${uploadError.message}`,
      fieldErrors,
    };
  }

  const floorPlanUrl = getPublicFloorPlanUrl(floorPlanPath);
  const code = getNextProjectCode(name);
  const projectObjectType = objectType as ProjectInsert["object_type"];

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .in("id", Array.from(new Set([...responsibleUsers, currentUser.currentUser.id])));

  if (profileError || !profileRows || profileRows.length === 0) {
    return {
      error: "Could not load responsible users. Please try again.",
      fieldErrors,
    };
  }

  const roleMap = new Map(profileRows.map((profile) => [profile.id, profile.role]));
  const memberIds = Array.from(new Set([...responsibleUsers, currentUser.currentUser.id]));

  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    code,
    name,
    client_name: clientName,
    object_type: projectObjectType,
    location: address,
    description: description || null,
    status: "planned",
    progress_percent: 0,
    floor_plan_url: floorPlanUrl,
    floor_plan_path: floorPlanPath,
    start_date: startDate,
    target_end_date: endDate,
    created_by: currentUser.currentUser.id,
  });

  if (projectError) {
    return {
      error: `Project creation failed: ${projectError.message}`,
      fieldErrors,
    };
  }

  const { error: membersError } = await supabase.from("project_members").insert(
    memberIds.map((profileId, index) => ({
      project_id: projectId,
      profile_id: profileId,
      role: roleMap.get(profileId) ?? currentUser.currentUser.role,
      is_primary: index === 0,
    })),
  );

  if (membersError) {
    return {
      error: `Project members could not be saved: ${membersError.message}`,
      fieldErrors,
    };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  redirect(`/projects/${projectId}?created=1`);
}
