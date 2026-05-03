import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { notificationId } = await params;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now, updated_at: now })
    .eq("id", notificationId)
    .eq("recipient_id", session.currentUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
