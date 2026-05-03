const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getSupabaseConfig() {
  const isConfigured =
    supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")
      ? supabaseAnonKey.length > 0
      : false;

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured,
  };
}

