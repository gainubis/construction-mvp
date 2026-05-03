import type {
  InspectionChecklistResult,
  ProjectReportSummary,
  StageReportDetail,
  StageReportSummary,
} from "@/lib/projects/types";
import { getDemoProjectDetail, demoProjectProfiles } from "@/lib/projects/demo";
import { getReports, getStages } from "@/lib/demo-data";
import { getDemoStageDetail } from "@/lib/stages/demo";

export function getDemoProjectReports(projectId: string): ProjectReportSummary[] {
  const stages = getStages(projectId);
  const reports = getReports(projectId);

  return reports.map((report, index) => {
    const stage = stages[index % Math.max(stages.length, 1)] ?? null;

    const baseReport: StageReportSummary = {
      id: `${report.id}-${index}`,
      stage_id: stage?.id ?? `stage-${index + 1}`,
      checklist_id: null,
      reported_by: demoProjectProfiles[1].id,
      report_date: "2026-04-20",
      status: index === 0 ? "approved" : "submitted",
      summary: report.title,
      inspector_comments: "Field team completed the inspection and recorded a few follow-up items.",
      issues: index === 0 ? null : "Need follow-up on photos and QA note.",
      recommendations: "Continue after crew sign-off.",
      health_score: index === 0 ? 92 : 76,
      progress_before: index === 0 ? 60 : 40,
      progress_after: index === 0 ? 72 : 52,
      ai_summary_text: index === 0 ? "Overall inspection looks stable with minor follow-up actions." : null,
      ai_issues: index === 0 ? "Minor punch list items remain." : null,
      ai_recommendations: index === 0 ? "Recheck outlet testing and close punch list notes." : null,
      ai_health_status: index === 0 ? "healthy" : null,
      ai_next_action: index === 0 ? "Complete closeout checks." : null,
      ai_model: "gpt-4o-mini",
      ai_generated_at: "2026-04-20T09:15:00.000Z",
      ai_generation_error: null,
      created_at: "2026-04-20T09:00:00.000Z",
      updated_at: "2026-04-20T09:15:00.000Z",
      reported_by_profile: demoProjectProfiles[1],
      photo_count: 2,
    };

    return {
      ...baseReport,
      stage: stage
        ? {
            id: stage.id,
            project_id: projectId,
            name: stage.name,
            sequence: index + 1,
            status: stage.status === "Complete" ? "complete" : "in_progress",
          }
        : null,
    };
  });
}

export function getDemoReportDetail(projectId: string, reportId: string): StageReportDetail | null {
  const project = getDemoProjectDetail(projectId);
  const stage = getDemoStageDetail(projectId, getStages(projectId)[0]?.id ?? "");

  if (!project || !stage) {
    return null;
  }

  const report = getDemoProjectReports(projectId).find((item) => item.id === reportId) ?? getDemoProjectReports(projectId)[0];

  if (!report) {
    return null;
  }

  const inspectionResults: InspectionChecklistResult[] = (stage.checklist?.items ?? []).map((item, index) => ({
    id: `${report.id}-result-${index + 1}`,
    report_id: report.id,
    checklist_item_id: item.id,
    result: index === 1 ? "failed" : "passed",
    comment: index === 1 ? "Outlet cover needs replacement." : "Checked and approved.",
    created_at: "2026-04-20T09:10:00.000Z",
    updated_at: "2026-04-20T09:10:00.000Z",
    checklist_item: {
      id: item.id,
      title: item.title,
      description: item.description,
      item_type: item.item_type,
      sort_order: item.sort_order,
      is_required: item.is_required,
    },
  }));

  return {
    ...report,
    stage: {
      id: stage.id,
      project_id: projectId,
      name: stage.name,
      sequence: stage.sequence,
      status: stage.status,
      progress_percent: stage.progress_percent,
      planned_end_date: stage.planned_end_date,
    },
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      location: project.location,
      status: project.status,
      object_type: project.object_type,
    },
    checklist: stage.checklist
      ? {
          id: stage.checklist.id,
          name: stage.checklist.name,
          description: stage.checklist.description,
        }
      : null,
    photos: [
      {
        id: `${report.id}-photo-1`,
        report_id: report.id,
        storage_path: "demo/inspection-1.jpg",
        caption: "Inspection photo 1",
        sort_order: 1,
        created_at: "2026-04-20T09:10:00.000Z",
      },
      {
        id: `${report.id}-photo-2`,
        report_id: report.id,
        storage_path: "demo/inspection-2.jpg",
        caption: "Inspection photo 2",
        sort_order: 2,
        created_at: "2026-04-20T09:11:00.000Z",
      },
    ],
    inspection_results: inspectionResults,
  };
}
