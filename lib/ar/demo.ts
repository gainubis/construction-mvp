import { demoProjectProfiles, getDemoProjectDetail } from "@/lib/projects/demo";
import type { ARPlanDetail, ARPlanSummary } from "@/lib/projects/types";
import { getStages } from "@/lib/demo-data";

function buildMarkers(planId: string) {
  return [
    {
      id: `${planId}-m1`,
      ar_plan_id: planId,
      marker_type: "socket" as const,
      x_percent: 24,
      y_percent: 56,
      label: "Socket A",
      notes: "Desk line outlet",
      sort_order: 1,
      created_at: "2026-05-01T08:00:00.000Z",
      updated_at: "2026-05-01T08:00:00.000Z",
    },
    {
      id: `${planId}-m2`,
      ar_plan_id: planId,
      marker_type: "switch" as const,
      x_percent: 43,
      y_percent: 34,
      label: "Switch B",
      notes: "Near corridor entry",
      sort_order: 2,
      created_at: "2026-05-01T08:00:00.000Z",
      updated_at: "2026-05-01T08:00:00.000Z",
    },
    {
      id: `${planId}-m3`,
      ar_plan_id: planId,
      marker_type: "light" as const,
      x_percent: 71,
      y_percent: 22,
      label: "Light point",
      notes: "Pendant position",
      sort_order: 3,
      created_at: "2026-05-01T08:00:00.000Z",
      updated_at: "2026-05-01T08:00:00.000Z",
    },
  ];
}

export function getDemoArPlans(projectId: string): ARPlanSummary[] {
  const project = getDemoProjectDetail(projectId);

  if (!project) {
    return [];
  }

  const stage = getStages(projectId)[0] ?? null;
  const planId = `${projectId}-ar-plan`;

  return [
    {
      id: planId,
      project_id: projectId,
      stage_id: stage?.id ?? null,
      uploaded_by: demoProjectProfiles[1].id,
      title: `${project.name} wall plan`,
      wall_photo_path: "demo/window.svg",
      notes: "Demo AR plan loaded without Supabase configuration.",
      created_at: "2026-05-01T08:00:00.000Z",
      updated_at: "2026-05-01T09:00:00.000Z",
      stage: stage ? { id: stage.id, name: stage.name, sequence: 1 } : null,
      uploaded_by_profile: demoProjectProfiles[1],
      marker_count: 3,
      wall_photo_url: "/window.svg",
    },
  ];
}

export function getDemoArPlanDetail(projectId: string, planId?: string | null): ARPlanDetail | null {
  const plans = getDemoArPlans(projectId);
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? plans[0];

  if (!selectedPlan) {
    return null;
  }

  return {
    ...selectedPlan,
    markers: buildMarkers(selectedPlan.id),
  };
}

