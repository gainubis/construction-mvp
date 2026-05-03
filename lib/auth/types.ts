export const roles = ["admin", "foreman", "engineer", "worker"] as const;

export type Role = (typeof roles)[number];

export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
};

export type AuthState = {
  error: string | null;
};

