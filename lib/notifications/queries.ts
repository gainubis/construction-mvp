import type { NotificationSummary } from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getNotificationsForUser(userId: string, limit = 8): Promise<NotificationSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
        id,
        recipient_id,
        project_id,
        stage_id,
        report_id,
        violation_id,
        act_id,
        type,
        title,
        body,
        is_read,
        read_at,
        created_at,
        updated_at,
        project:projects(
          id,
          name,
          code
        ),
        stage:stages(
          id,
          name
        ),
        violation:safety_violations(
          id,
          title,
          violation_type,
          severity
        )
      `,
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    project: normalizeSingleRelation(item.project),
    stage: normalizeSingleRelation(item.stage),
    violation: normalizeSingleRelation(item.violation),
  })) as NotificationSummary[];
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}
