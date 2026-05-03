"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { ActCompletionFormState, ProfileSummary } from "@/lib/projects/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStageDetail } from "@/lib/stages/queries";
import { getReportById } from "@/lib/reports/queries";
import { ACT_PDF_BUCKET, buildActPdfPath } from "@/lib/acts/storage";
import { buildStageActPdf } from "@/lib/acts/pdf";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildFieldError(field: keyof ActCompletionFormState["fieldErrors"], message: string): ActCompletionFormState {
  return {
    error: message,
    fieldErrors: {
      [field]: message,
    },
  };
}

async function requireContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const session = await getCurrentUser();
  if (!session) {
    return null;
  }

  const profile: ProfileSummary = {
    id: session.currentUser.id,
    full_name: session.profile?.full_name ?? session.currentUser.fullName,
    email: session.profile?.email ?? session.currentUser.email,
    avatar_url: session.profile?.avatar_url ?? session.currentUser.avatarUrl,
    role: session.currentUser.role,
  };

  return { supabase, currentUser: session.currentUser, currentProfile: profile };
}

async function recalculateProjectProgress(supabase: SupabaseClient, projectId: string) {
  const { data: stages } = await supabase
    .from("stages")
    .select("status, progress_percent")
    .eq("project_id", projectId);

  if (!stages || stages.length === 0) {
    return null;
  }

  const total = stages.length;
  const completed = stages.filter((stage) => stage.status === "complete").length;
  const averageProgress = Math.round(
    stages.reduce((sum, stage) => sum + (stage.progress_percent ?? 0), 0) / total,
  );

  const status = completed === total ? "completed" : "active";

  const { error } = await supabase
    .from("projects")
    .update({
      progress_percent: averageProgress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  return error?.message ?? null;
}

function buildActNumber(projectCode: string, stageSequence: number, actCount: number) {
  const now = new Date();
  const yearMonthDay = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `ACT-${projectCode}-${String(stageSequence).padStart(2, "0")}-${yearMonthDay}-${String(actCount + 1).padStart(2, "0")}`;
}

async function cleanupUploadedAct(
  supabase: SupabaseClient,
  pdfPath: string | null,
  actId: string,
) {
  if (pdfPath) {
    await supabase.storage.from(ACT_PDF_BUCKET).remove([pdfPath]);
  }

  await supabase.from("acts").delete().eq("id", actId);
}

export async function completeStageAction(
  _: ActCompletionFormState,
  formData: FormData,
): Promise<ActCompletionFormState> {
  const projectId = getStringValue(formData, "projectId");
  const stageId = getStringValue(formData, "stageId");
  const reportId = getStringValue(formData, "reportId");
  const comments = getStringValue(formData, "comments");
  const signatureDataUrl = getStringValue(formData, "signatureDataUrl");

  if (!projectId || !stageId || !reportId) {
    return {
      error: "Stage context is missing.",
      fieldErrors: {},
    };
  }

  if (!comments) {
    return buildFieldError("comments", "Enter final review comments.");
  }

  if (!signatureDataUrl) {
    return buildFieldError("signatureDataUrl", "Capture a signature before completing the stage.");
  }

  const context = await requireContext();
  if (!context) {
    return {
      error: "Sign in to complete the stage.",
      fieldErrors: {},
    };
  }

  const { supabase, currentProfile } = context;
  const stage = await getStageDetail(projectId, stageId);
  if (!stage) {
    return {
      error: "Stage not found.",
      fieldErrors: {},
    };
  }

  if (!stage.checklist || stage.checklist.items.length === 0) {
    return {
      error: "Attach a checklist before completing the stage.",
      fieldErrors: {},
    };
  }

  if (stage.status === "complete") {
    return {
      error: "This stage has already been completed.",
      fieldErrors: {},
    };
  }

  const latestReport = stage.reports[0];
  if (!latestReport || latestReport.id !== reportId) {
    return {
      error: "Use the latest inspection report for final sign-off.",
      fieldErrors: {},
    };
  }

  const reportDetail = await getReportById(projectId, reportId);
  if (!reportDetail) {
    return {
      error: "Final report could not be loaded.",
      fieldErrors: {},
    };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, code")
    .eq("id", projectId)
    .maybeSingle();

  const { data: stageSnapshot } = await supabase
    .from("stages")
    .select("id, status, progress_percent, actual_start_date, actual_end_date")
    .eq("id", stageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!project || !stageSnapshot) {
    return {
      error: "Project or stage record could not be loaded.",
      fieldErrors: {},
    };
  }

  const actId = randomUUID();
  const actCountResult = await supabase.from("acts").select("id", { count: "exact", head: true }).eq("stage_id", stageId);
  const actNumber = buildActNumber(project.code, stage.sequence, actCountResult.count ?? 0);
  const signedAt = new Date().toISOString();
  const pdfPath = buildActPdfPath(projectId, stageId, actId);

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildStageActPdf({
      actNumber,
      stage,
      report: reportDetail,
      preparedBy: currentProfile,
      signedBy: currentProfile,
      finalComments: comments,
      signatureDataUrl,
      signedAt,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "PDF generation failed.",
      fieldErrors: {},
    };
  }

  const uploadResult = await supabase.storage.from(ACT_PDF_BUCKET).upload(pdfPath, pdfBytes, {
    upsert: false,
    contentType: "application/pdf",
  });

  if (uploadResult.error) {
    return {
      error: `Could not store the act PDF: ${uploadResult.error.message}`,
      fieldErrors: {},
    };
  }

  const { error: actInsertError } = await supabase.from("acts").insert({
    id: actId,
    project_id: projectId,
    stage_id: stageId,
    prepared_by: currentProfile.id,
    signed_by: currentProfile.id,
    act_number: actNumber,
    status: "signed",
    summary: comments,
    signed_at: signedAt,
    pdf_path: pdfPath,
  });

  if (actInsertError) {
    await supabase.storage.from(ACT_PDF_BUCKET).remove([pdfPath]);
    return {
      error: actInsertError.message,
      fieldErrors: {},
    };
  }

  const { error: stageUpdateError } = await supabase
    .from("stages")
    .update({
      status: "complete",
      progress_percent: 100,
      actual_start_date: stageSnapshot.actual_start_date ?? stage.actual_start_date ?? signedAt,
      actual_end_date: signedAt,
      updated_at: signedAt,
    })
    .eq("id", stageId)
    .eq("project_id", projectId);

  if (stageUpdateError) {
    await cleanupUploadedAct(supabase, pdfPath, actId);
    return {
      error: stageUpdateError.message,
      fieldErrors: {},
    };
  }

  const projectProgressError = await recalculateProjectProgress(supabase, projectId);

  if (projectProgressError) {
    await supabase
      .from("stages")
      .update({
        status: stageSnapshot.status,
        progress_percent: stageSnapshot.progress_percent,
        actual_start_date: stageSnapshot.actual_start_date,
        actual_end_date: stageSnapshot.actual_end_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stageId)
      .eq("project_id", projectId);

    await cleanupUploadedAct(supabase, pdfPath, actId);
    return {
      error: projectProgressError,
      fieldErrors: {},
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/stages/${stageId}`);
  revalidatePath(`/projects/${projectId}/acts`);

  redirect(`/projects/${projectId}/stages/${stageId}?completed=1&actId=${actId}`);
}
