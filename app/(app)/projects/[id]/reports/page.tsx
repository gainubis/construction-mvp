import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody } from "@/components/ui/panel";
import { getProjectById } from "@/lib/projects/queries";
import { getProjectReports } from "@/lib/reports/queries";
import { cn } from "@/lib/utils";

type ReportsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { id } = await params;
  const [project, reports] = await Promise.all([getProjectById(id), getProjectReports(id)]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Дневной контроль"
        title={`${project.name} — отчеты`}
        description="Просматривайте историю осмотров, AI-сводки, результаты чек-листов и состояние этапов."
        action={
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Назад к проекту
          </Link>
        }
      />

      {reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Panel key={report.id} className="overflow-hidden">
              <PanelBody className="p-0">
                <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {report.stage?.name ?? "Этап не назначен"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {report.report_date}
                          </span>
                        </div>
                        <h2 className="mt-3 text-lg font-semibold text-slate-950">{report.summary}</h2>
                        <p className="mt-2 text-sm text-slate-600">
                          Автор: {report.reported_by_profile?.full_name ?? "Неизвестно"} | {report.created_at}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <HealthBadge status={report.ai_health_status} />
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            report.health_score >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : report.health_score >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700",
                          )}
                        >
                          {report.health_score}/100
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Прогресс</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {report.progress_before ?? 0}% {"->"} {report.progress_after ?? 0}%
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Фото</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">{report.photo_count}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Статус AI</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {report.ai_summary_text ? "Сгенерировано" : report.ai_generation_error ? "Нужна повторная попытка" : "Ожидание"}
                        </p>
                      </div>
                    </div>

                    {report.ai_summary_text ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI-сводка</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{report.ai_summary_text}</p>
                      </div>
                    ) : null}

                    {report.inspector_comments ? (
                      <p className="mt-5 text-sm leading-6 text-slate-600">{report.inspector_comments}</p>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                    <div className="flex h-full flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Следующий шаг</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Откройте полный отчет, чтобы просмотреть результаты чек-листа и при необходимости сгенерировать AI-сводку заново.
                        </p>
                      </div>

                      <Link
                        href={`/projects/${project.id}/reports/${report.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Открыть отчет
                      </Link>
                    </div>
                  </div>
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Отчетов нет"
          description="После отправки осмотров здесь появится полная временная шкала отчетов."
        />
      )}
    </>
  );
}
