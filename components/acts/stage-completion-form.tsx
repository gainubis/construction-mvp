"use client";

import { useActionState, useMemo, useState } from "react";
import { completeStageAction } from "@/lib/acts/actions";
import type { ActCompletionFormState, StageDetail, StageReportDetail } from "@/lib/projects/types";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { ReportResultsList } from "@/components/reports/report-results-list";
import { SignatureCanvas } from "@/components/acts/signature-canvas";

type StageCompletionFormProps = {
  stage: StageDetail;
  report: StageReportDetail;
};

const initialState: ActCompletionFormState = {
  error: null,
  fieldErrors: {},
};

function CompletionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatStableDateTime(value: string | null | undefined) {
  if (!value) {
    return "Неизвестно";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Неизвестно";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function StageCompletionForm({ stage, report }: StageCompletionFormProps) {
  const [state, formAction, pending] = useActionState(completeStageAction, initialState);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const results = report.inspection_results;
    return {
      total: results.length,
      passed: results.filter((item) => item.result === "passed").length,
      failed: results.filter((item) => item.result === "failed").length,
      notApplicable: results.filter((item) => item.result === "not_applicable").length,
    };
  }, [report.inspection_results]);

  const latestReportTimestamp = formatStableDateTime(report.created_at);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={stage.project_id} />
      <input type="hidden" name="stageId" value={stage.id} />
      <input type="hidden" name="reportId" value={report.id} />
      <input type="hidden" name="signatureDataUrl" value={signatureDataUrl ?? ""} />

      <Panel>
        <PanelHeader>
          <PanelTitle>Сводка финальной проверки</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CompletionMetric label="Пункты чек-листа" value={`${metrics.total}`} />
            <CompletionMetric label="Пройдено" value={`${metrics.passed}`} />
            <CompletionMetric label="Не пройдено" value={`${metrics.failed}`} />
            <CompletionMetric label="Н/П" value={`${metrics.notApplicable}`} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Этап</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{stage.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                Последовательность {stage.sequence} | {stage.status.replace("_", " ")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Последний отчет</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{report.summary || "Отчет осмотра"}</p>
              <p className="mt-1 text-sm text-slate-600">Отправлен {latestReportTimestamp}</p>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <ReportResultsList results={report.inspection_results} />

      <Panel>
        <PanelHeader>
          <PanelTitle>Итоговые комментарии</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Заметки по завершению</span>
            <textarea
              name="comments"
              rows={6}
              required
              defaultValue={report.inspector_comments ?? ""}
              placeholder="Кратко опишите финальную проверку, оставшиеся замечания и комментарии по подписанию."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </label>

          {state.fieldErrors.comments ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.comments}</p>
          ) : null}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelTitle>Панель подписи</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <SignatureCanvas
            value={signatureDataUrl}
            onChange={setSignatureDataUrl}
            label="Подпишите итоговый акт"
            description="Используйте указатель или касание, чтобы захватить цифровую подпись для этой записи завершения."
          />

          {state.fieldErrors.signatureDataUrl ? (
            <p className="mt-3 text-sm text-rose-600">{state.fieldErrors.signatureDataUrl}</p>
          ) : null}
        </PanelBody>
      </Panel>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Отправка завершит этап, сформирует PDF акта и обновит прогресс проекта.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Генерация акта..." : "Завершить этап"}
        </button>
      </div>
    </form>
  );
}
