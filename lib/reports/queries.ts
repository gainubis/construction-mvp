import type {
  InspectionChecklistResult,
  ProjectReportSummary,
  StageReportDetail,
} from "@/lib/projects/types";
import { getDemoProjectReports, getDemoReportDetail } from "@/lib/reports/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getProjectReports(projectId: string): Promise<ProjectReportSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoProjectReports(projectId);
  }

  const { data: reports, error } = await supabase
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
        ),
        stage:stages!stage_reports_stage_id_fkey(
          id,
          project_id,
          name,
          sequence,
          status
        )
      `,
    )
    .order("report_date", { ascending: false });

  if (error || !reports) {
    return [];
  }

  const reportIds = reports.map((report) => report.id);
  const photoRows = reportIds.length
    ? (
        await supabase
          .from("report_photos")
          .select("id, report_id")
          .in("report_id", reportIds)
      ).data ?? []
    : [];

  const photoCountByReportId = photoRows.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.report_id] = (acc[photo.report_id] ?? 0) + 1;
    return acc;
  }, {});

  return reports
    .filter((report) => {
      const stage = normalizeSingleRelation(report.stage);
      return stage?.project_id === projectId;
    })
    .map((report) => ({
      ...report,
      reported_by_profile: normalizeSingleRelation(report.reported_by_profile),
      photo_count: photoCountByReportId[report.id] ?? 0,
      stage: normalizeSingleRelation(report.stage),
    })) as ProjectReportSummary[];
}

export async function getReportById(projectId: string, reportId: string): Promise<StageReportDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoReportDetail(projectId, reportId);
  }

  const { data: report, error: reportError } = await supabase
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
        stage:stages!stage_reports_stage_id_fkey(
          id,
          project_id,
          name,
          sequence,
          status,
          progress_percent,
          planned_end_date,
          project:projects(
            id,
            code,
            name,
            location,
            status,
            object_type
          )
        ),
        checklist:checklists!stage_reports_checklist_id_fkey(
          id,
          name,
          description
        ),
        reported_by_profile:profiles!stage_reports_reported_by_fkey(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `,
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !report) {
    return null;
  }

  const [{ data: photoRows }, { data: inspectionRows }] = await Promise.all([
    supabase
      .from("report_photos")
      .select("id, report_id, storage_path, caption, sort_order, created_at")
      .eq("report_id", reportId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("inspection_item_results")
      .select(
        `
          id,
          report_id,
          checklist_item_id,
          result,
          comment,
          created_at,
          updated_at,
          checklist_item:checklist_items(
            id,
            title,
            description,
            item_type,
            sort_order,
            is_required
          )
        `,
      )
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
  ]);

  const stage = normalizeSingleRelation(report.stage);
  const project = stage ? normalizeSingleRelation(stage.project) : null;
  const checklist = normalizeSingleRelation(report.checklist);
  const reportedBy = normalizeSingleRelation(report.reported_by_profile);

  if (!stage || !project || stage.project_id !== projectId) {
    return null;
  }

  const inspection_results = ((inspectionRows ?? []) as Array<
    InspectionChecklistResult & {
      checklist_item: InspectionChecklistResult["checklist_item"] | InspectionChecklistResult["checklist_item"][];
    }
  >).map((item) => ({
    ...item,
    checklist_item: normalizeSingleRelation(item.checklist_item),
  }));

  return {
    ...report,
    stage,
    project,
    checklist,
    reported_by_profile: reportedBy,
    photo_count: photoRows?.length ?? 0,
    photos: photoRows ?? [],
    inspection_results,
  } as StageReportDetail;
}
