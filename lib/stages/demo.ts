import type { SafetyViolationType, StageDetail } from "@/lib/projects/types";
import { getDemoProjectDetail, demoProjectProfiles } from "@/lib/projects/demo";
import { getDemoProjectActs } from "@/lib/acts/demo";
import { getProject, getReports, getSafetyRecords, getStages } from "@/lib/demo-data";

export function getDemoStageDetail(projectId: string, stageId: string): StageDetail | null {
  const projectDetail = getDemoProjectDetail(projectId);
  const projectSummary = projectDetail
    ? {
        id: projectDetail.id,
        code: projectDetail.code,
        name: projectDetail.name,
        location: projectDetail.location,
        status: projectDetail.status,
        object_type: projectDetail.object_type,
      }
    : {
        id: getProject(projectId).id,
        code: "CF-DEMO",
        name: getProject(projectId).name,
        location: getProject(projectId).location,
        status: "active" as const,
        object_type: "renovation" as const,
      };

  const stage = getStages(projectId).find((item) => item.id === stageId) ?? getStages(projectId)[0];

  if (!stage) {
    return null;
  }

  const responsibleProfile = demoProjectProfiles.find((profile) => profile.full_name === stage.responsible) ?? null;
  const checklist = {
    id: `checklist-${stage.id}`,
    project_id: projectId,
    name: `${stage.name} inspection checklist`,
    description: "Demo checklist used to exercise the daily inspection flow.",
    created_by: demoProjectProfiles[1].id,
    created_at: "2026-04-01T09:00:00.000Z",
    updated_at: "2026-04-20T09:00:00.000Z",
    items: [
      {
        id: `${stage.id}-item-1`,
        checklist_id: `checklist-${stage.id}`,
        sort_order: 1,
        title: "Crew briefed",
        description: "Confirm the team reviewed the scope and risks.",
        item_type: "boolean" as const,
        expected_value: "Briefed",
        is_required: true,
        created_at: "2026-04-01T09:00:00.000Z",
        updated_at: "2026-04-20T09:00:00.000Z",
      },
      {
        id: `${stage.id}-item-2`,
        checklist_id: `checklist-${stage.id}`,
        sort_order: 2,
        title: "Photo evidence uploaded",
        description: "Attach at least one site photo for the report.",
        item_type: "photo" as const,
        expected_value: "Photos attached",
        is_required: true,
        created_at: "2026-04-01T09:00:00.000Z",
        updated_at: "2026-04-20T09:00:00.000Z",
      },
      {
        id: `${stage.id}-item-3`,
        checklist_id: `checklist-${stage.id}`,
        sort_order: 3,
        title: "Quality notes recorded",
        description: "Add inspection comments with blockers and follow-up actions.",
        item_type: "text" as const,
        expected_value: "Comments entered",
        is_required: true,
        created_at: "2026-04-01T09:00:00.000Z",
        updated_at: "2026-04-20T09:00:00.000Z",
      },
    ],
  };
  const reports = getReports(projectId).map((report, index) => ({
    id: `${report.id}-${index}`,
    stage_id: stage.id,
    checklist_id: null,
    reported_by: responsibleProfile?.id ?? demoProjectProfiles[1].id,
    report_date: "2026-04-20",
    status: index === 0 ? ("approved" as const) : ("submitted" as const),
    summary: report.title,
    inspector_comments: "Field team completed the inspection and recorded a few follow-up items.",
    issues: index === 0 ? null : "Need follow-up on photos and QA note.",
    recommendations: "Continue after crew sign-off.",
    health_score: index === 0 ? 92 : 76,
    progress_before: index === 0 ? 60 : 40,
    progress_after: index === 0 ? 72 : 52,
    ai_summary_text:
      index === 0
        ? "Inspection looks healthy with only a few closeout items remaining."
        : "The inspection identified a few follow-up items that should be closed before sign-off.",
    ai_issues: index === 0 ? "Minor punch list items remain." : "Photos and QA note need follow-up.",
    ai_recommendations:
      index === 0
        ? "Complete the remaining closeout checks and archive the report."
        : "Revisit the field notes, upload any missing photos, and confirm QA corrections.",
    ai_health_status: index === 0 ? "healthy" : "watch",
    ai_next_action: index === 0 ? "Finish the closeout checklist." : "Resolve the open follow-up items.",
    ai_model: "gpt-4o-mini",
    ai_generated_at: "2026-04-20T09:15:00.000Z",
    ai_generation_error: null,
    created_at: "2026-04-20T09:00:00.000Z",
    updated_at: "2026-04-20T09:00:00.000Z",
    reported_by_profile: responsibleProfile,
    photo_count: 2,
  }));

  const safety = getSafetyRecords(projectId).map((item, index) => ({
    id: `${item.id}-${index}`,
    project_id: projectId,
    stage_id: stage.id,
    reported_by: demoProjectProfiles[0].id,
    assigned_to: demoProjectProfiles[3].id,
    violation_type: item.violation as SafetyViolationType,
    severity: index === 0 ? ("high" as const) : ("medium" as const),
    status: index === 0 ? ("open" as const) : ("resolved" as const),
    title: item.violation,
    details: item.violation,
    location_note: "Level 4 corridor",
    occurred_at: "2026-04-20T08:30:00.000Z",
    resolved_at: index === 0 ? null : "2026-04-20T10:15:00.000Z",
    created_at: "2026-04-20T08:30:00.000Z",
    updated_at: "2026-04-20T10:15:00.000Z",
    reported_by_profile: demoProjectProfiles[0],
    assigned_to_profile: demoProjectProfiles[3],
    stage: {
      id: stage.id,
      name: stage.name,
      sequence: 1,
    },
    photos_count: index === 0 ? 3 : 1,
  }));
  const acts = getDemoProjectActs(projectId).filter((act) => act.stage_id === stage.id);

  return {
    id: stage.id,
    project_id: projectId,
    checklist_id: null,
    responsible_profile_id: responsibleProfile?.id ?? null,
    name: stage.name,
    sequence: 1,
    status:
      stage.status === "Complete"
        ? "complete"
        : stage.status === "In progress"
          ? "in_progress"
          : stage.status === "Review"
            ? "review"
            : "planned",
    progress_percent: stage.progress,
    planned_start_date: "2026-04-01",
    planned_end_date: stage.deadline,
    actual_start_date: "2026-04-01",
    actual_end_date: stage.status === "Complete" ? stage.deadline : null,
    notes: stage.responsible,
    created_at: "2026-03-01T09:00:00.000Z",
    updated_at: "2026-04-20T09:00:00.000Z",
    project: projectSummary,
    responsible_profile: responsibleProfile,
    checklist,
    reports,
    safety_violations: safety,
    acts,
  };
}
