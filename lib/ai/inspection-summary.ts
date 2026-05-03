import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  InspectionSummaryInput,
  InspectionSummaryOutput,
} from "@/lib/ai/inspection-summary-prompt";
import {
  buildInspectionSummarySystemPrompt,
  buildInspectionSummaryUserPrompt,
  composeInspectionSummaryText,
  inspectionSummarySchema,
} from "@/lib/ai/inspection-summary-prompt";
import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai-client";

type ServerSupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type InspectionSummaryContext = {
  report: {
    id: string;
    stage_id: string;
    checklist_id: string | null;
    reported_by: string;
    report_date: string;
    status: string;
    summary: string;
    inspector_comments: string | null;
    issues: string | null;
    recommendations: string | null;
    health_score: number;
    progress_before: number | null;
    progress_after: number | null;
    ai_summary_text: string | null;
    ai_issues: string | null;
    ai_recommendations: string | null;
    ai_health_status: string | null;
    ai_next_action: string | null;
    ai_model: string | null;
    ai_generated_at: string | null;
    ai_generation_error: string | null;
  };
  project: {
    id: string;
    name: string;
    code: string;
    location: string;
  };
  stage: {
    id: string;
    name: string;
  };
  inspectionItems: Array<{
    id: string;
    title: string;
    description: string | null;
    item_type: string;
    sort_order: number;
    is_required: boolean;
    result: "passed" | "failed" | "not_applicable";
    comment: string | null;
  }>;
  photoCount: number;
  detectedIssuesText: string | null;
};

export type InspectionSummaryGenerationResult =
  | {
      ok: true;
      reportId: string;
      model: string;
      summary: InspectionSummaryOutput;
      generatedAt: string;
    }
  | {
      ok: false;
      reportId: string;
      error: string;
      reason: "not_found" | "not_configured" | "openai_error" | "parse_error" | "database_error";
    };

function isInspectionSummaryHealthStatus(value: string): value is InspectionSummaryOutput["overallStageHealthStatus"] {
  return value === "healthy" || value === "watch" || value === "at_risk" || value === "critical";
}

function normalizeInspectionSummaryOutput(value: unknown): InspectionSummaryOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<InspectionSummaryOutput> & {
    summary?: unknown;
    identifiedIssues?: unknown;
    recommendations?: unknown;
    overallStageHealthStatus?: unknown;
    suggestedNextAction?: unknown;
  };

  if (
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.identifiedIssues) ||
    !Array.isArray(candidate.recommendations) ||
    typeof candidate.overallStageHealthStatus !== "string" ||
    !isInspectionSummaryHealthStatus(candidate.overallStageHealthStatus) ||
    typeof candidate.suggestedNextAction !== "string"
  ) {
    return null;
  }

  return {
    summary: candidate.summary.trim(),
    identifiedIssues: candidate.identifiedIssues.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean),
    recommendations: candidate.recommendations.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean),
    overallStageHealthStatus: candidate.overallStageHealthStatus,
    suggestedNextAction: candidate.suggestedNextAction.trim(),
  };
}

function buildDerivedDetectedIssuesText(context: InspectionSummaryContext) {
  const failedItems = context.inspectionItems.filter((item) => item.result === "failed");

  if (context.detectedIssuesText?.trim()) {
    return context.detectedIssuesText.trim();
  }

  if (context.report.issues?.trim()) {
    return context.report.issues.trim();
  }

  if (failedItems.length === 0) {
    return null;
  }

  return failedItems
    .map((item) => {
      const note = item.comment?.trim() ? ` - ${item.comment.trim()}` : "";
      return `${item.title}${note}`;
    })
    .join("; ");
}

async function loadInspectionSummaryContext(
  supabase: SupabaseClient,
  reportId: string,
  detectedIssuesText?: string | null,
): Promise<InspectionSummaryContext | null> {
  const { data: report, error: reportError } = await supabase
    .from("stage_reports")
    .select(
      "id, stage_id, checklist_id, reported_by, report_date, status, summary, inspector_comments, issues, recommendations, health_score, progress_before, progress_after, ai_summary_text, ai_issues, ai_recommendations, ai_health_status, ai_next_action, ai_model, ai_generated_at, ai_generation_error",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !report) {
    return null;
  }

  const [{ data: stage, error: stageError }, { data: photoRows }, { data: inspectionRows }] = await Promise.all([
    supabase
      .from("stages")
      .select("id, project_id, name, project:projects(id, name, code, location)")
      .eq("id", report.stage_id)
      .maybeSingle(),
    supabase.from("report_photos").select("id, report_id").eq("report_id", reportId),
    supabase
      .from("inspection_item_results")
      .select(
        `
          id,
          report_id,
          checklist_item_id,
          result,
          comment,
          checklist_item:checklist_items(
            id,
            title,
            description,
            item_type,
            sort_order,
            is_required
          )
        `,
      )
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
  ]);

  if (stageError || !stage) {
    return null;
  }

  const projectRelation = Array.isArray(stage.project) ? stage.project[0] ?? null : stage.project;

  if (!projectRelation) {
    return null;
  }

  const project = {
    id: projectRelation.id,
    name: projectRelation.name,
    code: projectRelation.code,
    location: projectRelation.location,
  };

  const inspectionItems = (inspectionRows ?? []).map((item) => {
    const checklistItem = Array.isArray(item.checklist_item) ? item.checklist_item[0] ?? null : item.checklist_item;

    return {
      id: item.id,
      title: checklistItem?.title ?? "Checklist item",
      description: checklistItem?.description ?? null,
      item_type: checklistItem?.item_type ?? "boolean",
      sort_order: checklistItem?.sort_order ?? 0,
      is_required: checklistItem?.is_required ?? false,
      result: item.result,
      comment: item.comment,
    };
  });

  const detectedIssues = buildDerivedDetectedIssuesText({
    report,
    project,
    stage: {
      id: stage.id,
      name: stage.name,
    },
    inspectionItems,
    photoCount: photoRows?.length ?? 0,
    detectedIssuesText: detectedIssuesText ?? null,
  });

  return {
    report,
    project,
    stage: {
      id: stage.id,
      name: stage.name,
    },
    inspectionItems,
    photoCount: photoRows?.length ?? 0,
    detectedIssuesText: detectedIssues ?? null,
  };
}

export async function generateAndStoreInspectionSummary(
  reportId: string,
  options?: {
    supabase?: ServerSupabaseClient;
    detectedIssuesText?: string | null;
  },
): Promise<InspectionSummaryGenerationResult> {
  const supabase = options?.supabase ?? (await createSupabaseServerClient());

  if (!supabase) {
    return {
      ok: false,
      reportId,
      reason: "not_configured",
      error: "Supabase is not configured.",
    };
  }

  const context = await loadInspectionSummaryContext(supabase, reportId, options?.detectedIssuesText);

  if (!context) {
    return {
      ok: false,
      reportId,
      reason: "not_found",
      error: "Inspection report was not found.",
    };
  }

  const openai = getOpenAIClient();

  if (!openai) {
    const { error: updateError } = await supabase
      .from("stage_reports")
      .update({
        ai_generation_error: "OPENAI_API_KEY is not configured.",
        ai_generated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      return {
        ok: false,
        reportId,
        reason: "database_error",
        error: updateError.message,
      };
    }

    return {
      ok: false,
      reportId,
      reason: "not_configured",
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  const promptInput: InspectionSummaryInput = {
    projectName: context.project.name,
    stageName: context.stage.name,
    checklistItems: context.inspectionItems.map((item) => ({
      title: item.title,
      status: item.result,
      comment: item.comment,
      itemType: item.item_type,
      isRequired: item.is_required,
    })),
    inspectorComment: context.report.inspector_comments ?? "",
    detectedIssuesText: context.detectedIssuesText,
    photoCount: context.photoCount,
  };

  try {
    const response = await openai.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content: buildInspectionSummarySystemPrompt(),
        },
        {
          role: "user",
          content: buildInspectionSummaryUserPrompt(promptInput),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "inspection_summary",
          strict: true,
          schema: inspectionSummarySchema,
        },
      },
    });

    const parsed = normalizeInspectionSummaryOutput(
      response.output_text ? JSON.parse(response.output_text) : null,
    );

    if (!parsed) {
      const { error: updateError } = await supabase
        .from("stage_reports")
        .update({
          ai_generation_error: "OpenAI response did not match the expected schema.",
          ai_generated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (updateError) {
        return {
          ok: false,
          reportId,
          reason: "database_error",
          error: updateError.message,
        };
      }

      return {
        ok: false,
        reportId,
        reason: "parse_error",
        error: "OpenAI response did not match the expected schema.",
      };
    }

    const aiSummaryText = composeInspectionSummaryText(parsed);
    const generatedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("stage_reports")
      .update({
        ai_summary_text: aiSummaryText,
        ai_issues: parsed.identifiedIssues.join("\n"),
        ai_recommendations: parsed.recommendations.join("\n"),
        ai_health_status: parsed.overallStageHealthStatus,
        ai_next_action: parsed.suggestedNextAction,
        ai_model: getOpenAIModel(),
        ai_generated_at: generatedAt,
        ai_generation_error: null,
        updated_at: generatedAt,
      })
      .eq("id", reportId);

    if (updateError) {
      return {
        ok: false,
        reportId,
        reason: "database_error",
        error: updateError.message,
      };
    }

    return {
      ok: true,
      reportId,
      model: getOpenAIModel(),
      summary: parsed,
      generatedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed.";

    const { error: updateError } = await supabase
      .from("stage_reports")
      .update({
        ai_generation_error: message,
        ai_generated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      return {
        ok: false,
        reportId,
        reason: "database_error",
        error: updateError.message,
      };
    }

    return {
      ok: false,
      reportId,
      reason: "openai_error",
      error: message,
    };
  }
}
