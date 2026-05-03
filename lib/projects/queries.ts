import { getCurrentUser } from "@/lib/auth/session";
import { demoProjectProfiles, demoProjectSummaries, getDemoProjectDetail } from "@/lib/projects/demo";
import type {
  ChecklistRow,
  ProjectAssigneeOption,
  ProjectDetail,
  ProjectMemberWithProfile,
  ProjectStageSummary,
  ProjectSummary,
  ProfileSummary,
} from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapCountByProject(rows: Array<{ project_id: string }>) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
    return acc;
  }, {});
}

function mapProjectSummary(row: {
  id: string;
  code: string;
  name: string;
  client_name: string;
  object_type: ProjectSummary["objectType"];
  location: string;
  status: ProjectSummary["status"];
  progress_percent: number;
  floor_plan_url: string | null;
  floor_plan_path: string | null;
  start_date: string | null;
  target_end_date: string | null;
}): ProjectSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    clientName: row.client_name,
    objectType: row.object_type,
    location: row.location,
    status: row.status,
    progressPercent: row.progress_percent,
    floorPlanUrl: row.floor_plan_url,
    floorPlanPath: row.floor_plan_path,
    startDate: row.start_date,
    targetEndDate: row.target_end_date,
    memberCount: 0,
    stageCount: 0,
  };
}

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoProjectSummaries;
  }

  const { data: projectRows, error } = await supabase
    .from("projects")
    .select(
      "id, code, name, client_name, object_type, location, status, progress_percent, floor_plan_url, floor_plan_path, start_date, target_end_date",
    )
    .order("updated_at", { ascending: false });

  if (error || !projectRows) {
    return demoProjectSummaries;
  }

  const projectIds = projectRows.map((project) => project.id);

  if (projectIds.length === 0) {
    return [];
  }

  const [{ data: memberRows }, { data: stageRows }] = await Promise.all([
    supabase.from("project_members").select("project_id").in("project_id", projectIds),
    supabase.from("stages").select("project_id").in("project_id", projectIds),
  ]);

  const memberCounts = mapCountByProject(memberRows ?? []);
  const stageCounts = mapCountByProject(stageRows ?? []);

  return projectRows.map((project) => ({
    ...mapProjectSummary(project),
    memberCount: memberCounts[project.id] ?? 0,
    stageCount: stageCounts[project.id] ?? 0,
  }));
}

export async function getProjectById(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoProjectDetail(projectId);
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, code, name, client_name, object_type, location, description, status, start_date, target_end_date, actual_end_date, progress_percent, floor_plan_url, floor_plan_path, created_by, created_at, updated_at",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return getDemoProjectDetail(projectId);
  }

  const [{ data: memberRows }, { data: stageRows }] = await Promise.all([
    supabase
      .from("project_members")
      .select(
        "project_id, profile_id, role, is_primary, joined_at, profile:profiles(id, full_name, email, avatar_url, role)",
      )
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true }),
    supabase
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
          responsible_profile:profiles!stages_responsible_profile_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            role
          ),
          checklist:checklists!stages_checklist_id_fkey(
            id,
            name
          )
        `,
      )
      .eq("project_id", projectId)
      .order("sequence", { ascending: true }),
  ]);

  const members = (memberRows ?? []).map((member) => {
    const typedMember = member as ProjectMemberWithProfile;

    return {
      project_id: typedMember.project_id,
      profile_id: typedMember.profile_id,
      role: typedMember.role,
      is_primary: typedMember.is_primary,
      joined_at: typedMember.joined_at,
      profile: normalizeSingleRelation(typedMember.profile as ProfileSummary | ProfileSummary[] | null),
    };
  });

  const stages = (stageRows ?? []).map((stage) => {
    const typedStage = stage as ProjectStageSummary & {
      responsible_profile: ProfileSummary | ProfileSummary[] | null;
      checklist: Pick<ChecklistRow, "id" | "name"> | Pick<ChecklistRow, "id" | "name">[] | null;
    };

    return {
      ...typedStage,
      responsible_profile: normalizeSingleRelation(typedStage.responsible_profile),
      checklist: normalizeSingleRelation(typedStage.checklist),
    };
  });

  return {
    ...project,
    members,
    stages,
  };
}

export async function getProjectAssigneeOptions() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoProjectProfiles;
  }

  const currentUser = await getCurrentUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .order("full_name", { ascending: true });

  if (error || !data) {
    return currentUser
      ? [
          {
            id: currentUser.currentUser.id,
            full_name: currentUser.currentUser.fullName,
            email: currentUser.currentUser.email,
            role: currentUser.currentUser.role,
            avatar_url: currentUser.currentUser.avatarUrl,
          },
        ]
      : demoProjectProfiles;
  }

  return data as ProjectAssigneeOption[];
}
