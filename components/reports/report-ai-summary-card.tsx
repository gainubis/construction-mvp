import type { StageReportDetail } from "@/lib/projects/types";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { ReportRegenerateButton } from "@/components/reports/report-regenerate-button";

type ReportAiSummaryCardProps = {
  report: StageReportDetail;
};

function splitLines(value: string | null | undefined) {
  return value
    ? value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
}

function formatStableDateTime(value: string | null | undefined) {
  if (!value) {
    return "Пока не сгенерировано";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Пока не сгенерировано";
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

function HealthBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    healthy: "bg-emerald-50 text-emerald-700",
    watch: "bg-amber-50 text-amber-700",
    at_risk: "bg-rose-50 text-rose-700",
    critical: "bg-rose-100 text-rose-800",
  };

  if (!status) {
      return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Ожидание</span>;
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.watch}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function ReportAiSummaryCard({ report }: ReportAiSummaryCardProps) {
  const issues = splitLines(report.ai_issues);
  const recommendations = splitLines(report.ai_recommendations);
  const hasSummary = Boolean(report.ai_summary_text);

  return (
    <Panel>
      <PanelHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PanelTitle>AI-сводка осмотра</PanelTitle>
            <p className="mt-1 text-sm text-slate-500">Сформировано на основе отправленного чек-листа, комментариев и количества фото.</p>
          </div>
          <HealthBadge status={report.ai_health_status} />
        </div>
      </PanelHeader>
      <PanelBody>
        {report.ai_generation_error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {report.ai_generation_error}
          </div>
        ) : null}

        {hasSummary ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Short summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{report.ai_summary_text}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identified issues</p>
                {issues.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {issues.map((issue, index) => (
                      <li key={`${issue}-${index}`} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                        {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No material issues were identified by the model.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
                {recommendations.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {recommendations.map((recommendation, index) => (
                      <li key={`${recommendation}-${index}`} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No recommendations were produced.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested next action</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{report.ai_next_action ?? "Regenerate the summary to produce a next step."}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model metadata</p>
                <p className="mt-2 text-sm text-slate-700">{report.ai_model ?? "Unknown model"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatStableDateTime(report.ai_generated_at)}</p>
              </div>
            </div>
          </div>
        ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">Для этого отчета AI-сводка еще не сгенерирована.</p>
            </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReportRegenerateButton reportId={report.id} label={hasSummary ? "Сгенерировать заново" : "Сгенерировать AI-сводку"} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {report.photo_count} фото проанализировано
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
}
