import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generateAndStoreInspectionSummary } from "@/lib/ai/inspection-summary";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in to regenerate the AI summary." }, { status: 401 });
  }

  const { reportId } = await params;
  const body = (await request.json().catch(() => null)) as { detectedIssuesText?: string | null } | null;

  const result = await generateAndStoreInspectionSummary(reportId, {
    detectedIssuesText: body?.detectedIssuesText ?? null,
  });

  if (!result.ok) {
    const statusByReason: Record<typeof result.reason, number> = {
      not_found: 404,
      not_configured: 503,
      openai_error: 502,
      parse_error: 502,
      database_error: 500,
    };

    return NextResponse.json(
      {
        error: result.error,
        reason: result.reason,
      },
      { status: statusByReason[result.reason] ?? 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    reportId: result.reportId,
    model: result.model,
    generatedAt: result.generatedAt,
    summary: result.summary,
  });
}
