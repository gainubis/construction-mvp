import type { SafetyViolationDetail, SafetyViolationSummary } from "@/lib/projects/types";
import { demoProjectProfiles, getDemoProjectDetail } from "@/lib/projects/demo";
import { getSafetyRecords, getStages } from "@/lib/demo-data";

function demoStageFor(projectId: string, index: number) {
  const stage = getStages(projectId)[index % Math.max(getStages(projectId).length, 1)];
  return stage
    ? {
        id: stage.id,
        name: stage.name,
        sequence: index + 1,
      }
    : null;
}

export function getDemoSafetyViolations(projectId: string): SafetyViolationSummary[] {
  const records = getSafetyRecords(projectId);

  return records.map((record, index) => ({
    id: `${record.id}-${index}`,
    project_id: projectId,
    stage_id: demoStageFor(projectId, index)?.id ?? null,
    reported_by: demoProjectProfiles[0].id,
    assigned_to: demoProjectProfiles[1].id,
    violation_type: index === 0 ? "no_helmet" : "blocked_passage",
    severity: index === 0 ? "high" : "medium",
    status: index === 0 ? "open" : "resolved",
    title: record.violation,
    details: `${record.violation} recorded during the demo safety feed.`,
    location_note: "Level 4 corridor",
    occurred_at: "2026-04-20T09:10:00.000Z",
    resolved_at: index === 0 ? null : "2026-04-20T11:45:00.000Z",
    created_at: "2026-04-20T09:10:00.000Z",
    updated_at: "2026-04-20T11:45:00.000Z",
    reported_by_profile: demoProjectProfiles[0],
    assigned_to_profile: demoProjectProfiles[1],
    stage: demoStageFor(projectId, index),
    photos_count: 2,
  }));
}

export function getDemoSafetyViolationDetail(projectId: string, violationId: string): SafetyViolationDetail | null {
  const project = getDemoProjectDetail(projectId);
  const violation = getDemoSafetyViolations(projectId).find((item) => item.id === violationId) ?? getDemoSafetyViolations(projectId)[0];

  if (!project || !violation) {
    return null;
  }

  return {
    ...violation,
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      location: project.location,
      status: project.status,
      object_type: project.object_type,
    },
    photos: [
      {
        id: `${violation.id}-photo-1`,
        violation_id: violation.id,
        storage_path: "demo/safety-1.jpg",
        caption: "Safety evidence photo",
        sort_order: 1,
        created_at: "2026-04-20T09:12:00.000Z",
        updated_at: "2026-04-20T09:12:00.000Z",
      },
      {
        id: `${violation.id}-photo-2`,
        violation_id: violation.id,
        storage_path: "demo/safety-2.jpg",
        caption: "Second evidence photo",
        sort_order: 2,
        created_at: "2026-04-20T09:13:00.000Z",
        updated_at: "2026-04-20T09:13:00.000Z",
      },
    ],
  };
}
