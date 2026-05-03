import { getSupabaseConfig } from "@/lib/supabase/config";

export const SAFETY_EVIDENCE_BUCKET = "safety-evidence";

export function buildSafetyEvidencePath(projectId: string, violationId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  return `projects/${projectId}/violations/${violationId}/${Date.now()}-${safeName}`;
}

export function getSafetyEvidenceUrl(path: string) {
  const { url } = getSupabaseConfig();
  return `${url}/storage/v1/object/public/${SAFETY_EVIDENCE_BUCKET}/${path}`;
}
