import type { ARPlanDetail, ARPlanSummary } from "@/lib/projects/types";
import { getDemoArPlanDetail, getDemoArPlans } from "@/lib/ar/demo";
import { AR_WALL_PHOTOS_BUCKET } from "@/lib/ar/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function getWallPhotoUrl(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, storagePath: string) {
  return supabase.storage.from(AR_WALL_PHOTOS_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function getProjectArPlans(projectId: string): Promise<ARPlanSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoArPlans(projectId);
  }

  const { data, error } = await supabase
    .from("ar_plans")
    .select(
      `
        id,
        project_id,
        stage_id,
        uploaded_by,
        title,
        wall_photo_path,
        notes,
        created_at,
        updated_at,
        stage:stages(
          id,
          name,
          sequence
        ),
        uploaded_by_profile:profiles!ar_plans_uploaded_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const planIds = data.map((plan) => plan.id);
  const markerRows =
    planIds.length > 0
      ? (
          await supabase
            .from("ar_markers")
            .select("id, ar_plan_id")
            .in("ar_plan_id", planIds)
        ).data ?? []
      : [];

  const markerCountByPlanId = markerRows.reduce<Record<string, number>>((acc, marker) => {
    acc[marker.ar_plan_id] = (acc[marker.ar_plan_id] ?? 0) + 1;
    return acc;
  }, {});

  return data.map((plan) => ({
    ...plan,
    stage: normalizeSingleRelation(plan.stage),
    uploaded_by_profile: normalizeSingleRelation(plan.uploaded_by_profile),
    marker_count: markerCountByPlanId[plan.id] ?? 0,
    wall_photo_url: plan.wall_photo_path ? getWallPhotoUrl(supabase, plan.wall_photo_path) : null,
  })) as ARPlanSummary[];
}

export async function getProjectArPlanById(projectId: string, planId?: string | null): Promise<ARPlanDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoArPlanDetail(projectId, planId);
  }

  const query = supabase
    .from("ar_plans")
    .select(
      `
        id,
        project_id,
        stage_id,
        uploaded_by,
        title,
        wall_photo_path,
        notes,
        created_at,
        updated_at,
        stage:stages(
          id,
          name,
          sequence
        ),
        uploaded_by_profile:profiles!ar_plans_uploaded_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("project_id", projectId);

  if (planId) {
    query.eq("id", planId);
  }

  const { data: plan, error } = await query.maybeSingle();

  if (error || !plan) {
    return null;
  }

  const { data: markers } = await supabase
    .from("ar_markers")
    .select("id, ar_plan_id, marker_type, x_percent, y_percent, label, notes, sort_order, created_at, updated_at")
    .eq("ar_plan_id", plan.id)
    .order("sort_order", { ascending: true });

  return {
    ...(plan as ARPlanDetail),
    stage: normalizeSingleRelation(plan.stage),
    uploaded_by_profile: normalizeSingleRelation(plan.uploaded_by_profile),
    marker_count: markers?.length ?? 0,
    wall_photo_url: plan.wall_photo_path ? getWallPhotoUrl(supabase, plan.wall_photo_path) : null,
    markers: markers ?? [],
  };
}

