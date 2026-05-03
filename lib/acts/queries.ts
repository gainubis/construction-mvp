import type { ActDetail, ActSummary } from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACT_PDF_BUCKET } from "@/lib/acts/storage";
import { getDemoProjectActs, getDemoActDetail } from "@/lib/acts/demo";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function getActPdfUrl(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, storagePath: string) {
  return supabase.storage.from(ACT_PDF_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function getProjectActs(projectId: string): Promise<ActSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoProjectActs(projectId);
  }

  const { data, error } = await supabase
    .from("acts")
    .select(
      `
        id,
        project_id,
        stage_id,
        prepared_by,
        signed_by,
        act_number,
        status,
        summary,
        signed_at,
        pdf_path,
        created_at,
        updated_at,
        project:projects(
          id,
          code,
          name
        ),
        stage:stages(
          id,
          name,
          sequence
        ),
        prepared_by_profile:profiles!acts_prepared_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        signed_by_profile:profiles!acts_signed_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    project: normalizeSingleRelation(item.project),
    stage: normalizeSingleRelation(item.stage),
    prepared_by_profile: normalizeSingleRelation(item.prepared_by_profile),
    signed_by_profile: normalizeSingleRelation(item.signed_by_profile),
    pdf_url: item.pdf_path ? getActPdfUrl(supabase, item.pdf_path) : null,
  })) as ActSummary[];
}

export async function getStageActs(projectId: string, stageId: string): Promise<ActSummary[]> {
  const acts = await getProjectActs(projectId);
  return acts.filter((act) => act.stage_id === stageId);
}

export async function getActById(projectId: string, actId: string): Promise<ActDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoActDetail(projectId, actId);
  }

  const { data, error } = await supabase
    .from("acts")
    .select(
      `
        id,
        project_id,
        stage_id,
        prepared_by,
        signed_by,
        act_number,
        status,
        summary,
        signed_at,
        pdf_path,
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
        prepared_by_profile:profiles!acts_prepared_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        signed_by_profile:profiles!acts_signed_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("project_id", projectId)
    .eq("id", actId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...(data as ActDetail),
    project: normalizeSingleRelation(data.project),
    stage: normalizeSingleRelation(data.stage),
    prepared_by_profile: normalizeSingleRelation(data.prepared_by_profile),
    signed_by_profile: normalizeSingleRelation(data.signed_by_profile),
    pdf_url: data.pdf_path ? getActPdfUrl(supabase, data.pdf_path) : null,
  };
}

