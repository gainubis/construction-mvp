import { demoProjectProfiles } from "@/lib/projects/demo";
import type { ActDetail, ActSummary } from "@/lib/projects/types";

export function getDemoProjectActs(projectId: string): ActSummary[] {
  if (projectId !== "alpha-tower") {
    return [];
  }

  return [
    {
      id: "act-demo-1",
      project_id: projectId,
      stage_id: "alpha-stage-electrical",
      prepared_by: demoProjectProfiles[2].id,
      signed_by: demoProjectProfiles[1].id,
      act_number: "ACT-CF-2026-001-001",
      status: "signed",
      summary: "Electrical rough-in completed and signed off.",
      signed_at: "2026-04-22T14:20:00.000Z",
      pdf_path: "demo/act-demo-1.pdf",
      created_at: "2026-04-22T13:50:00.000Z",
      updated_at: "2026-04-22T14:20:00.000Z",
      project: { id: projectId, code: "CF-2026-001", name: "Alpha Tower Renovation" },
      stage: { id: "alpha-stage-electrical", name: "Electrical", sequence: 1 },
      prepared_by_profile: demoProjectProfiles[2],
      signed_by_profile: demoProjectProfiles[1],
      pdf_url: "/window.svg",
    },
  ];
}

export function getDemoActDetail(projectId: string, actId: string): ActDetail | null {
  const act = getDemoProjectActs(projectId).find((item) => item.id === actId);

  if (!act) {
    return null;
  }

  return {
    ...act,
    project: {
      id: projectId,
      code: "CF-2026-001",
      name: "Alpha Tower Renovation",
      location: "Moscow, Tverskaya 12",
      status: "active",
      object_type: "renovation",
    },
  };
}

