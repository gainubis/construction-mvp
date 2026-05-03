import { createServerClient, type CookieMethodsServer, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type MutableCookieStore = CookieStore & {
  set: (name: string, value: string, options: CookieOptions) => void;
};

function createCookieAdapter(cookieStore: MutableCookieStore): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet, headers) {
      void headers;
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  };
}

export async function createSupabaseServerClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  const cookieStore = (await cookies()) as MutableCookieStore;

  return createServerClient<Database>(url, anonKey, {
    cookies: createCookieAdapter(cookieStore),
  });
}
