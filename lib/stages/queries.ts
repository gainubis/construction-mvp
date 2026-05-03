import type {
  ActSummary,
  ChecklistItemRow,
  ChecklistRow,
  ProfileSummary,
  SafetyViolationSummary,
  StageDetail,
  StageReportSummary,
} from "@/lib/projects/types";
import { ACT_PDF_BUCKET } from "@/lib/acts/storage";
import { getDemoStageDetail } from "@/lib/stages/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeProfile(value: ProfileSummary | ProfileSummary[] | null | undefined) {
  return normalizeSingleRelation(value);
}

export async function getStageDetail(projectId: string, stageId: string): Promise<StageDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoStageDetail(projectId, stageId);
  }

  const { data: stage, error } = await supabase
    .from("stages")
    .select(
      `
        id,
        project_id,
        checklist_id,
        responsible_profile_id,
        name,
        sequence,
        status,
        progress_percent,
        planned_start_date,
        planned_end_date,
        actual_start_date,
        actual_end_date,
        notes,
        created_at,
        updated_at,
        project:projects!stages_project_id_fkey(
          id,
          code,
          name,
          location,
          status,
          object_type
        ),
        responsible_profile:profiles!stages_responsible_profile_id_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        ),
        checklist:checklists!stages_checklist_id_fkey(
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        )
      `,
    )
    .eq("project_id", projectId)
    .eq("id", stageId)
    .maybeSingle();

  if (error || !stage) {
    return getDemoStageDetail(projectId, stageId);
  }

  const checklist = normalizeSingleRelation(stage.checklist as ChecklistRow | ChecklistRow[] | null);
  const responsibleProfile = normalizeProfile(stage.responsible_profile as ProfileSummary | ProfileSummary[] | null);
  const project = normalizeSingleRelation(stage.project as StageDetail["project"] | StageDetail["project"][] | null);

  const checklistItems = checklist
    ? await supabase
        .from("checklist_items")
        .select(
          "id, checklist_id, sort_order, title, description, item_type, expected_value, is_required, created_at, updated_at",
        )
        .eq("checklist_id", checklist.id)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  const [reportsResult, safetyResult, actsResult] = await Promise.all([
    supabase
      .from("stage_reports")
      .select(
        `
          id,
          stage_id,
          checklist_id,
          reported_by,
          report_date,
          status,
          summary,
          inspector_comments,
          issues,
          recommendations,
          health_score,
          progress_before,
          progress_after,
          ai_summary_text,
          ai_issues,
          ai_recommendations,
          ai_health_status,
          ai_next_action,
          ai_model,
          ai_generated_at,
          ai_generation_error,
          created_at,
          updated_at,
          reported_by_profile:profiles!stage_reports_reported_by_fkey(
            id,
            full_name,
            email,
            avatar_url,
            role
          )
        `,
      )
      .eq("stage_id", stageId)
      .order("report_date", { ascending: false }),
    supabase
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
          )
        `,
      )
      .eq("stage_id", stageId)
      .order("occurred_at", { ascending: false }),
    supabase
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
      .eq("stage_id", stageId)
      .order("created_at", { ascending: false }),
  ]);

  const reportRows = (reportsResult.data ?? []) as Array<StageReportSummary & { reported_by_profile: ProfileSummary | ProfileSummary[] | null }>;
  const safetyRows = (safetyResult.data ?? []) as Array<SafetyViolationSummary & {
    reported_by_profile: ProfileSummary | ProfileSummary[] | null;
    assigned_to_profile: ProfileSummary | ProfileSummary[] | null;
  }>;
  const reportIds = reportRows.map((report) => report.id);
  const photoRows = reportIds.length
    ? ((
        await supabase
          .from("report_photos")
          .select("id, report_id, storage_path, caption, sort_order, created_at")
          .in("report_id", reportIds)
      ).data ?? [])
    : [];

  const photoCountByReportId = photoRows.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.report_id] = (acc[photo.report_id] ?? 0) + 1;
    return acc;
  }, {});

  const reports = reportRows.map((report) => ({
    ...report,
    reported_by_profile: normalizeProfile(report.reported_by_profile),
    photo_count: photoCountByReportId[report.id] ?? 0,
  }));

  const safety_violations = safetyRows.map((violation) => ({
    ...violation,
    reported_by_profile: normalizeProfile(violation.reported_by_profile),
    assigned_to_profile: normalizeProfile(violation.assigned_to_profile),
  }));

  const acts = ((actsResult.data ?? []) as Array<
    ActSummary & {
      project: ActSummary["project"] | ActSummary["project"][] | null;
      stage: ActSummary["stage"] | ActSummary["stage"][] | null;
      prepared_by_profile: ProfileSummary | ProfileSummary[] | null;
      signed_by_profile: ProfileSummary | ProfileSummary[] | null;
    }
  >).map((act) => ({
    ...act,
    project: normalizeSingleRelation(act.project),
    stage: normalizeSingleRelation(act.stage),
    prepared_by_profile: normalizeProfile(act.prepared_by_profile),
    signed_by_profile: normalizeProfile(act.signed_by_profile),
    pdf_url: act.pdf_path ? supabase.storage.from(ACT_PDF_BUCKET).getPublicUrl(act.pdf_path).data.publicUrl : null,
  }));

  return {
    id: stage.id,
    project_id: stage.project_id,
    checklist_id: stage.checklist_id,
    responsible_profile_id: stage.responsible_profile_id,
    name: stage.name,
    sequence: stage.sequence,
    status: stage.status,
    progress_percent: stage.progress_percent,
    planned_start_date: stage.planned_start_date,
    planned_end_date: stage.planned_end_date,
    actual_start_date: stage.actual_start_date,
    actual_end_date: stage.actual_end_date,
    notes: stage.notes,
    created_at: stage.created_at,
    updated_at: stage.updated_at,
    project: project ?? {
      id: projectId,
      code: "CF-UNKNOWN",
      name: "Unknown project",
      location: "",
      status: "planned",
      object_type: "other",
    },
    responsible_profile: responsibleProfile,
    checklist: checklist
      ? {
          ...checklist,
          items: ((checklistItems.data ?? []) as ChecklistItemRow[]).sort((left, right) => left.sort_order - right.sort_order),
        }
      : null,
    reports,
    safety_violations,
    acts,
  };
}
