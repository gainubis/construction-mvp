import type {
  ProjectSummary,
  SafetyViolationSummary,
  StageReportSummary,
} from "@/lib/projects/types";
import { demoProjectSummaries, getDemoProjectDetail } from "@/lib/projects/demo";
import { getReports, getSafetyRecords, getStages } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardProjectOverview = ProjectSummary & {
  activeStages: number;
  completedStages: number;
};

export type DashboardReportItem = Pick<
  StageReportSummary,
  "id" | "summary" | "created_at" | "report_date" | "reported_by_profile" | "photo_count"
> & {
  project: { id: string; code: string; name: string } | null;
  stage: { id: string; name: string; sequence: number } | null;
};

export type DashboardSafetyItem = Pick<
  SafetyViolationSummary,
  "id" | "title" | "severity" | "status" | "created_at" | "reported_by_profile" | "assigned_to_profile"
> & {
  project: { id: string; code: string; name: string } | null;
  stage: { id: string; name: string; sequence: number } | null;
};

export type DashboardDeadlineItem = {
  id: string;
  title: string;
  due: string;
  owner: string;
  project: { id: string; code: string; name: string } | null;
};

export type DashboardData = {
  projects: DashboardProjectOverview[];
  recentReports: DashboardReportItem[];
  recentSafetyViolations: DashboardSafetyItem[];
  upcomingDeadlines: DashboardDeadlineItem[];
  totalProjects: number;
  activeStages: number;
  completedStages: number;
  safetyIncidents: number;
  reportsToday: number;
};

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDashboardDate(value: string | null | undefined) {
  const date = normalizeDate(value);
  if (!date) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function describeDashboardProject(project: DashboardProjectOverview) {
  return `${project.activeStages} active stage${project.activeStages === 1 ? "" : "s"} • ${project.completedStages} completed`;
}

function buildDemoDashboardData(): DashboardData {
  const projectOverviews = demoProjectSummaries.map((project) => {
    const stages = getStages(project.id);
    return {
      ...project,
      activeStages: stages.filter((stage) => stage.status === "In progress" || stage.status === "Review").length,
      completedStages: stages.filter((stage) => stage.status === "Complete").length,
    };
  });

  const alphaProject = getDemoProjectDetail("alpha-tower");
  const alphaReports = getReports("alpha-tower").map((report, index) => ({
    id: `${report.id}-${index}`,
    summary: report.title,
    created_at: index === 0 ? "2026-05-03T08:40:00.000Z" : "2026-05-02T17:10:00.000Z",
    report_date: index === 0 ? "2026-05-03" : "2026-05-02",
    reported_by_profile: alphaProject?.members[1]?.profile ?? null,
    photo_count: index === 0 ? 3 : 2,
    project: { id: "alpha-tower", code: "CF-2026-001", name: "Alpha Tower Renovation" },
    stage: { id: "alpha-stage-electrical", name: "Electrical rough-in", sequence: 2 },
  }));

  const alphaSafety = getSafetyRecords("alpha-tower").map((item, index) => ({
    id: `${item.id}-${index}`,
    title: item.violation,
    severity: index === 0 ? ("high" as const) : ("medium" as const),
    status: index === 0 ? ("open" as const) : ("resolved" as const),
    created_at: index === 0 ? "2026-05-03T09:25:00.000Z" : "2026-05-03T07:55:00.000Z",
    reported_by_profile: alphaProject?.members[1]?.profile ?? null,
    assigned_to_profile: alphaProject?.members[2]?.profile ?? null,
    project: { id: "alpha-tower", code: "CF-2026-001", name: "Alpha Tower Renovation" },
    stage: { id: "alpha-stage-electrical", name: "Electrical rough-in", sequence: 2 },
  }));

  return {
    projects: projectOverviews,
    recentReports: alphaReports,
    recentSafetyViolations: alphaSafety,
    upcomingDeadlines: [
      {
        id: "d-1",
        title: "Electrical inspection",
        due: "2026-05-04",
        owner: "Irina S.",
        project: { id: "alpha-tower", code: "CF-2026-001", name: "Alpha Tower Renovation" },
      },
      {
        id: "d-2",
        title: "Finish checklist sign-off",
        due: "2026-05-06",
        owner: "Sergey P.",
        project: { id: "nova-residence", code: "CF-2026-002", name: "Nova Residence Fit-out" },
      },
      {
        id: "d-3",
        title: "Act signing",
        due: "2026-05-07",
        owner: "Engineer desk",
        project: { id: "alpha-tower", code: "CF-2026-001", name: "Alpha Tower Renovation" },
      },
    ],
    totalProjects: projectOverviews.length,
    activeStages: projectOverviews.reduce((sum, project) => sum + project.activeStages, 0),
    completedStages: projectOverviews.reduce((sum, project) => sum + project.completedStages, 0),
    safetyIncidents: alphaSafety.length,
    reportsToday: alphaReports.length,
  };
}

export async function getExecutiveDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildDemoDashboardData();
  }

  const today = new Date().toISOString().slice(0, 10);

  const [projectsResult, membersResult, stagesResult, reportsResult, safetyResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, code, name, client_name, object_type, location, status, progress_percent, floor_plan_url, floor_plan_path, start_date, target_end_date",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("project_members").select("project_id"),
    supabase
      .from("stages")
      .select("id, project_id, name, sequence, status, progress_percent, planned_end_date, project:projects(id, code, name)")
      .order("sequence", { ascending: true }),
    supabase
      .from("stage_reports")
      .select(
        `
          id,
          stage_id,
          report_date,
          created_at,
          summary,
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
            project:projects(
              id,
              code,
              name
            )
          )
        `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("safety_violations")
      .select(
        `
          id,
          project_id,
          stage_id,
          title,
          severity,
          status,
          created_at,
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
          ),
          stage:stages!safety_violations_stage_id_fkey(
            id,
            project_id,
            name,
            sequence,
            project:projects(
              id,
              code,
              name
            )
          )
        `,
      )
      .order("created_at", { ascending: false }),
  ]);

  if (projectsResult.error || membersResult.error || stagesResult.error || reportsResult.error || safetyResult.error) {
    return buildDemoDashboardData();
  }

  const projectRows = projectsResult.data ?? [];
  const memberCounts = (membersResult.data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
    return acc;
  }, {});

  const stageRows = (stagesResult.data ?? []).map((stage) => ({
    ...stage,
    project: normalizeSingleRelation(stage.project),
  }));

  const reportRows = (reportsResult.data ?? []).map((report) => ({
    ...report,
    stage: normalizeSingleRelation(report.stage),
    reported_by_profile: normalizeSingleRelation(report.reported_by_profile),
  }));

  const safetyRows = (safetyResult.data ?? []).map((item) => ({
    ...item,
    stage: normalizeSingleRelation(item.stage),
    reported_by_profile: normalizeSingleRelation(item.reported_by_profile),
    assigned_to_profile: normalizeSingleRelation(item.assigned_to_profile),
  }));

  const projectMap = new Map(
    projectRows.map((project) => [
      project.id,
      {
        id: project.id,
        code: project.code,
        name: project.name,
        clientName: project.client_name,
        objectType: project.object_type,
        location: project.location,
        status: project.status,
        progressPercent: project.progress_percent,
        floorPlanUrl: project.floor_plan_url,
        floorPlanPath: project.floor_plan_path,
        startDate: project.start_date,
        targetEndDate: project.target_end_date,
        memberCount: memberCounts[project.id] ?? 0,
        stageCount: 0,
        activeStages: 0,
        completedStages: 0,
      },
    ]),
  );

  stageRows.forEach((stage) => {
    const project = projectMap.get(stage.project_id);
    if (!project) {
      return;
    }

    project.stageCount += 1;
    if (stage.status === "complete") {
      project.completedStages += 1;
    }
    if (stage.status === "in_progress" || stage.status === "review") {
      project.activeStages += 1;
    }
  });

  const recentReports: DashboardReportItem[] = reportRows.slice(0, 5).map((report) => {
    const stage = normalizeSingleRelation(report.stage);
    const project = stage?.project ? normalizeSingleRelation(stage.project) : null;

    return {
      id: report.id,
      summary: report.summary ?? "Inspection report",
      created_at: report.created_at,
      report_date: report.report_date,
      reported_by_profile: normalizeSingleRelation(report.reported_by_profile),
      photo_count: 0,
      project: project ? { id: project.id, code: project.code, name: project.name } : null,
      stage: stage ? { id: stage.id, name: stage.name, sequence: stage.sequence } : null,
    };
  });

  const recentSafetyViolations: DashboardSafetyItem[] = safetyRows.slice(0, 5).map((item) => {
    const stage = normalizeSingleRelation(item.stage);
    const project = stage?.project ? normalizeSingleRelation(stage.project) : null;

    return {
      id: item.id,
      title: item.title,
      severity: item.severity,
      status: item.status,
      created_at: item.created_at,
      reported_by_profile: normalizeSingleRelation(item.reported_by_profile),
      assigned_to_profile: normalizeSingleRelation(item.assigned_to_profile),
      project: project ? { id: project.id, code: project.code, name: project.name } : null,
      stage: stage ? { id: stage.id, name: stage.name, sequence: stage.sequence } : null,
    };
  });

  const upcomingDeadlines: DashboardDeadlineItem[] = stageRows
    .filter((stage) => stage.planned_end_date)
    .map((stage) => ({
      id: stage.id,
      title: stage.name,
      due: stage.planned_end_date as string,
      owner: "Stage owner",
      project: stage.project
        ? { id: stage.project.id, code: stage.project.code, name: stage.project.name }
        : null,
    }))
    .sort((left, right) => {
      const leftDate = normalizeDate(left.due)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDate = normalizeDate(right.due)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })
    .slice(0, 6);

  return {
    projects: Array.from(projectMap.values()),
    recentReports,
    recentSafetyViolations,
    upcomingDeadlines,
    totalProjects: projectRows.length,
    activeStages: stageRows.filter((stage) => stage.status === "in_progress" || stage.status === "review").length,
    completedStages: stageRows.filter((stage) => stage.status === "complete").length,
    safetyIncidents: safetyRows.length,
    reportsToday: reportRows.filter((report) => (report.created_at ?? "").slice(0, 10) === today).length,
  };
}
