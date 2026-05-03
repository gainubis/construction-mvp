import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { ReportAiSummaryCard } from "@/components/reports/report-ai-summary-card";
import { ReportResultsList } from "@/components/reports/report-results-list";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getInspectionPhotoUrl } from "@/lib/stages/storage";
import { getReportById } from "@/lib/reports/queries";

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
    reportId: string;
  }>;
};

function DetailBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id, reportId } = await params;
  const report = await getReportById(id, reportId);
  const { isConfigured } = getSupabaseConfig();

  if (!report || !report.project || !report.stage) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Отчет осмотра"
        title={report.summary}
        description={`${report.project.name} | ${report.stage.name} | ${report.report_date}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/projects/${id}/reports`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Назад к отчетам
            </Link>
            <Link
              href={`/projects/${id}`}
              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Обзор проекта
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Отправил</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {report.reported_by_profile?.full_name ?? "Неизвестно"}
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Индекс состояния</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">{report.health_score}/100</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Фото</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">{report.photo_count}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Прогресс</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {report.progress_before ?? 0}% {"->"} {report.progress_after ?? 0}%
            </div>
          </PanelBody>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Метаданные отчета</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBadge label={`Этап: ${report.stage.name}`} />
                <DetailBadge label={`Проект: ${report.project.name}`} />
                <DetailBadge label={`Чек-лист: ${report.checklist?.name ?? "Не привязан"}`} />
                <DetailBadge label={`Статус: ${report.status.replace("_", " ")}`} />
              </div>
              {report.inspector_comments ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Комментарий инспектора</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{report.inspector_comments}</p>
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <ReportResultsList results={report.inspection_results} />
        </div>

        <div className="space-y-6">
          <ReportAiSummaryCard report={report} />

          <Panel>
            <PanelHeader>
              <PanelTitle>Фото-доказательства</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {report.photos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.photos.map((photo) => (
                    <figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="relative h-44 w-full">
                        <Image
                          src={isConfigured ? getInspectionPhotoUrl(photo.storage_path) : "/window.svg"}
                          alt={photo.caption ?? "Фото осмотра"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <figcaption className="px-4 py-3 text-xs text-slate-500">
                        {photo.caption ?? "Фото осмотра"}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Для этого отчета фото осмотра не сохранены.</p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </section>
    </>
  );
}
