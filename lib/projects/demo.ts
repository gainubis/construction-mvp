import type { ProjectDetail, ProjectSummary } from "@/lib/projects/types";
import { getStages as getLegacyStages } from "@/lib/demo-data";

export const demoProjectSummaries: ProjectSummary[] = [
  {
    id: "alpha-tower",
    code: "CF-2026-001",
    name: "Alpha Tower Renovation",
    clientName: "Prime Capital",
    objectType: "renovation",
    location: "Moscow, Tverskaya 12",
    status: "active",
    progressPercent: 72,
    floorPlanUrl: "/window.svg",
    floorPlanPath: null,
    startDate: "2026-03-01",
    targetEndDate: "2026-05-30",
    memberCount: 4,
    stageCount: 3,
  },
  {
    id: "nova-residence",
    code: "CF-2026-002",
    name: "Nova Residence Fit-out",
    clientName: "Nova Living",
    objectType: "fit_out",
    location: "Saint Petersburg, Nevsky 41",
    status: "on_hold",
    progressPercent: 41,
    floorPlanUrl: "/window.svg",
    floorPlanPath: null,
    startDate: "2026-02-12",
    targetEndDate: "2026-06-12",
    memberCount: 3,
    stageCount: 3,
  },
];

export const demoProjectProfiles = [
  {
    id: "admin-demo",
    full_name: "Anya Petrova",
    email: "admin@constructflow.demo",
    role: "admin" as const,
    avatar_url: null,
  },
  {
    id: "foreman-demo",
    full_name: "Ilya Sokolov",
    email: "foreman@constructflow.demo",
    role: "foreman" as const,
    avatar_url: null,
  },
  {
    id: "engineer-demo",
    full_name: "Mikhail Orlov",
    email: "engineer@constructflow.demo",
    role: "engineer" as const,
    avatar_url: null,
  },
  {
    id: "worker-demo",
    full_name: "Sergey Ivanov",
    email: "worker@constructflow.demo",
    role: "worker" as const,
    avatar_url: null,
  },
];

export function getDemoProjectDetail(projectId: string): ProjectDetail | null {
  if (projectId === "alpha-tower") {
    return {
      id: "alpha-tower",
      code: "CF-2026-001",
      name: "Alpha Tower Renovation",
      client_name: "Prime Capital",
      object_type: "renovation",
      location: "Moscow, Tverskaya 12",
      description: "Mixed interior renovation and MEP upgrade for a premium office floor.",
      status: "active",
      start_date: "2026-03-01",
      target_end_date: "2026-05-30",
      actual_end_date: null,
      progress_percent: 72,
      floor_plan_url: "/window.svg",
      floor_plan_path: null,
      created_by: "admin-demo",
      created_at: "2026-03-01T09:00:00.000Z",
      updated_at: "2026-04-20T09:00:00.000Z",
      members: [
        {
          project_id: "alpha-tower",
          profile_id: "admin-demo",
          role: "admin",
          is_primary: true,
          joined_at: "2026-03-01T09:00:00.000Z",
          profile: demoProjectProfiles[0],
        },
        {
          project_id: "alpha-tower",
          profile_id: "foreman-demo",
          role: "foreman",
          is_primary: false,
          joined_at: "2026-03-01T09:00:00.000Z",
          profile: demoProjectProfiles[1],
        },
        {
          project_id: "alpha-tower",
          profile_id: "engineer-demo",
          role: "engineer",
          is_primary: false,
          joined_at: "2026-03-01T09:00:00.000Z",
          profile: demoProjectProfiles[2],
        },
        {
          project_id: "alpha-tower",
          profile_id: "worker-demo",
          role: "worker",
          is_primary: false,
          joined_at: "2026-03-01T09:00:00.000Z",
          profile: demoProjectProfiles[3],
        },
      ],
      stages: getLegacyStages("alpha-tower").map((stage, index) => ({
        id: stage.id,
        project_id: "alpha-tower",
        checklist_id: null,
        responsible_profile_id: null,
        name: stage.name,
        sequence: index + 1,
        status:
          stage.status === "Complete"
            ? "complete"
            : stage.status === "In progress"
              ? "in_progress"
              : "planned",
        progress_percent: stage.progress,
        planned_start_date: "2026-04-01",
        planned_end_date: stage.deadline,
        actual_start_date: null,
        actual_end_date: stage.status === "Complete" ? stage.deadline : null,
        notes: stage.responsible,
        created_at: "2026-03-01T09:00:00.000Z",
        updated_at: "2026-04-20T09:00:00.000Z",
        responsible_profile: null,
        checklist: null,
      })),
    };
  }

  return null;
}
