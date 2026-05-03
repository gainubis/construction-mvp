import type { SafetyViolationDetail, SafetyViolationSummary } from "@/lib/projects/types";
import { getDemoSafetyViolationDetail, getDemoSafetyViolations } from "@/lib/safety/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSafetySeverity, isSafetyStatus } from "@/lib/safety/validation";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export type SafetyViolationFilters = {
  violationType?: string;
  status?: string;
  severity?: string;
};

export async function getProjectSafetyViolations(
  projectId: string,
  filters: SafetyViolationFilters = {},
): Promise<SafetyViolationSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoSafetyViolations(projectId);
  }

  const query = supabase
    .from("safety_violations")
    .select(
      `
        id,
        project_id,
        stage_id,
        reported_by,
        assigned_to,
        violation_type,
        severity,
        status,
        title,
        details,
        location_note,
        occurred_at,
        resolved_at,
        created_at,
        updated_at,
        reported_by_profile:profiles!safety_violations_reported_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        assigned_to_profile:profiles!safety_violations_assigned_to_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        stage:stages(
          id,
          name,
          sequence
        )
      `,
    )
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false });

  if (filters.violationType) {
    query.eq("violation_type", filters.violationType);
  }

  if (filters.status && isSafetyStatus(filters.status)) {
    query.eq("status", filters.status);
  }

  if (filters.severity && isSafetySeverity(filters.severity)) {
    query.eq("severity", filters.severity);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const violationIds = data.map((item) => item.id);
  const photoRows = violationIds.length
    ? (
        await supabase
          .from("safety_violation_photos")
          .select("id, violation_id")
          .in("violation_id", violationIds)
      ).data ?? []
    : [];

  const photoCountByViolationId = photoRows.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.violation_id] = (acc[photo.violation_id] ?? 0) + 1;
    return acc;
  }, {});

  return data.map((item) => ({
    ...item,
    reported_by_profile: normalizeSingleRelation(item.reported_by_profile),
    assigned_to_profile: normalizeSingleRelation(item.assigned_to_profile),
    stage: normalizeSingleRelation(item.stage),
    photos_count: photoCountByViolationId[item.id] ?? 0,
  })) as SafetyViolationSummary[];
}

export async function getSafetyViolationById(
  projectId: string,
  violationId: string,
): Promise<SafetyViolationDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoSafetyViolationDetail(projectId, violationId);
  }

  const { data: violation, error } = await supabase
    .from("safety_violations")
    .select(
      `
        id,
        project_id,
        stage_id,
        reported_by,
        assigned_to,
        violation_type,
        severity,
        status,
        title,
        details,
        location_note,
        occurred_at,
        resolved_at,
        created_at,
        updated_at,
        project:projects(
          id,
          code,
          name,
          location,
          status,
          object_type
        ),
        stage:stages(
          id,
          name,
          sequence
        ),
        reported_by_profile:profiles!safety_violations_reported_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        assigned_to_profile:profiles!safety_violations_assigned_to_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("project_id", projectId)
    .eq("id", violationId)
    .maybeSingle();

  if (error || !violation) {
    return null;
  }

  const { data: photos } = await supabase
    .from("safety_violation_photos")
    .select("id, violation_id, storage_path, caption, sort_order, created_at, updated_at")
    .eq("violation_id", violationId)
    .order("sort_order", { ascending: true });

  return {
    ...(violation as SafetyViolationDetail),
    project: normalizeSingleRelation(violation.project)!,
    stage: normalizeSingleRelation(violation.stage),
    reported_by_profile: normalizeSingleRelation(violation.reported_by_profile),
    assigned_to_profile: normalizeSingleRelation(violation.assigned_to_profile),
    photos_count: photos?.length ?? 0,
    photos: photos ?? [],
  };
}
