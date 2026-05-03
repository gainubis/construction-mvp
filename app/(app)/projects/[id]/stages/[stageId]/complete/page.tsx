import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StageCompletionForm } from "@/components/acts/stage-completion-form";
import { getReportById } from "@/lib/reports/queries";
import { getStageDetail } from "@/lib/stages/queries";

type StageCompletionPageProps = {
  params: Promise<{
    id: string;
    stageId: string;
  }>;
};

function SummaryMetric({ label, value }: { label: string; value: string }) {
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

export default async function StageCompletionPage({ params }: StageCompletionPageProps) {
  const { id, stageId } = await params;
  const stage = await getStageDetail(id, stageId);

  if (!stage) {
    notFound();
  }

  if (stage.status === "complete") {
    return (
      <>
        <PageHeader
          eyebrow="Завершение этапа"
          title={`${stage.name} уже завершен`}
          description="Акт для этого этапа уже был сформирован."
          action={
            <Link
              href={`/projects/${id}/stages/${stageId}`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Назад к этапу
            </Link>
          }
        />
        <EmptyState
          title="Завершение уже зафиксировано"
          description="У этого этапа уже есть подписанный акт и статус завершен."
          actionLabel="Посмотреть акты"
          actionHref={`/projects/${id}/acts`}
        />
      </>
    );
  }

  const latestReportSummary = stage.reports[0];
  const latestReport = latestReportSummary ? await getReportById(id, latestReportSummary.id) : null;

  if (!latestReport) {
    return (
      <EmptyState
        title="Отчет осмотра недоступен"
        description="Итоговый акт можно завершить только после сохранения последнего дневного осмотра."
        actionLabel="Назад к этапу"
        actionHref={`/projects/${id}/stages/${stageId}`}
      />
    );
  }

  const passed = latestReport.inspection_results.filter((item) => item.result === "passed").length;
  const failed = latestReport.inspection_results.filter((item) => item.result === "failed").length;
  const notApplicable = latestReport.inspection_results.filter((item) => item.result === "not_applicable").length;
  const submittedAt = formatStableDateTime(latestReport.created_at);

  return (
    <>
      <PageHeader
        eyebrow="Завершение этапа"
        title={`Завершить этап ${stage.name}`}
        description="Проверьте финальный осмотр, захватите цифровую подпись и сформируйте документ акта."
        action={
          <Link
            href={`/projects/${id}/stages/${stageId}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Назад к этапу
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryMetric label="Дата отчета" value={latestReport.report_date} />
        <SummaryMetric label="Индекс состояния" value={`${latestReport.health_score}/100`} />
        <SummaryMetric label="Завершенные пункты" value={`${passed} пройдено`} />
        <SummaryMetric label="Открытые пункты" value={`${failed} не пройдено | ${notApplicable} н/п`} />
      </section>

      {latestReport.ai_summary_text ? (
        <Panel>
          <PanelHeader>
            <PanelTitle>AI-сводка осмотра</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Сводка</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{latestReport.ai_summary_text}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Следующее действие</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {latestReport.ai_next_action ?? "Завершите акт и архивируйте записи этапа."}
                </p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <StageCompletionForm stage={stage} report={latestReport} />
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Требования к завершению</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-3 text-sm text-slate-600">
                <p>• Обязательны итоговые комментарии по проверке.</p>
                <p>• Необходимо захватить цифровую подпись.</p>
                <p>• Последний отчет осмотра будет зафиксирован в сформированном акте.</p>
                <p>• Этап перейдет в статус завершен, а прогресс проекта будет пересчитан.</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Метаданные отчета</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Автор</p>
                  <p className="mt-1 font-medium text-slate-950">
                    {latestReport.reported_by_profile?.full_name ?? "Неизвестно"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Комментарий по осмотру</p>
                  <p className="mt-1 leading-6 text-slate-700">
                    {latestReport.inspector_comments ?? "Комментарии инспектора не указаны."}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Отправлено</p>
                  <p className="mt-1 font-medium text-slate-950">{submittedAt}</p>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
