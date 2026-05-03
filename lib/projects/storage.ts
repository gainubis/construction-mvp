import { getSupabaseConfig } from "@/lib/supabase/config";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

export const FLOOR_PLAN_BUCKET = "floor-plans";

export function buildFloorPlanPath(projectId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  return `projects/${projectId}/floor-plans/${Date.now()}-${safeName}`;
}

export function getPublicFloorPlanUrl(path: string) {
  const { url } = getSupabaseConfig();
  return `${url}/storage/v1/object/public/${FLOOR_PLAN_BUCKET}/${path}`;
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
