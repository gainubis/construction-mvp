import type { CurrentUser, ProfileRecord, Role } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFallbackRole(role: string | null | undefined): Role {
  if (role === "admin" || role === "foreman" || role === "engineer" || role === "worker") {
    return role;
  }

  return "worker";
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  const profile = profileData as ProfileRecord | null;

  const role = getFallbackRole(
    profile?.role ?? data.user.user_metadata?.role ?? data.user.app_metadata?.role,
  );
  const fullName =
    profile?.full_name ||
    data.user.user_metadata?.full_name ||
    data.user.user_metadata?.name ||
    data.user.email ||
    "Workspace user";

  const currentUser: CurrentUser = {
    id: data.user.id,
    email: profile?.email ?? data.user.email ?? "",
    fullName,
    role,
    avatarUrl: profile?.avatar_url ?? data.user.user_metadata?.avatar_url ?? null,
  };

  return {
    user: data.user,
    profile: profile ?? null,
    currentUser,
  };
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return currentUser;
}
