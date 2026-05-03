import { getSupabaseConfig } from "@/lib/supabase/config";

export const INSPECTION_PHOTO_BUCKET = "inspection-photos";

export function buildInspectionPhotoPath(stageId: string, reportId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  return `stages/${stageId}/reports/${reportId}/${Date.now()}-${safeName}`;
}

export function getInspectionPhotoUrl(path: string) {
  const { url } = getSupabaseConfig();
  return `${url}/storage/v1/object/public/${INSPECTION_PHOTO_BUCKET}/${path}`;
}

