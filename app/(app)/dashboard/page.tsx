import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import {
  describeDashboardProject,
  formatDashboardDate,
  getExecutiveDashboardData,
} from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Panel>
      <PanelBody className="space-y-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        <p className="text-sm leading-6 text-slate-600">{note}</p>
      </PanelBody>
    </Panel>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: "bg-slate-100 text-slate-700",
    active: "bg-emerald-50 text-emerald-700",
    on_hold: "bg-amber-50 text-amber-700",
    completed: "bg-blue-50 text-blue-700",
    archived: "bg-slate-100 text-slate-500",
    in_progress: "bg-emerald-50 text-emerald-700",
    review: "bg-blue-50 text-blue-700",
    blocked: "bg-rose-50 text-rose-700",
    complete: "bg-violet-50 text-violet-700",
    open: "bg-rose-50 text-rose-700",
    resolved: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", styles[status] ?? styles.planned)}>
      {status.replace("_", " ")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-rose-50 text-rose-700",
    critical: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", styles[severity.toLowerCase()] ?? styles.low)}>
      {severity}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-500">Прогресс</span>
        <span className="font-medium text-slate-900">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const dashboard = await getExecutiveDashboardData();

  return (
    <>
      <PageHeader
        eyebrow="Обзор руководителя"
        title="Панель"
        description="Контролируйте состояние проектов, безопасность, отчетность и ближайшие закрывающие работы из единого рабочего пространства."
        action={
          <Link
            href="/projects"
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Перейти к проектам
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Всего проектов"
          value={String(dashboard.totalProjects)}
          note="Все активные и запланированные строительные объекты в рабочем пространстве."
        />
        <MetricCard
          label="Активные этапы"
          value={String(dashboard.activeStages)}
          note="Этапы, которые сейчас выполняются или находятся на проверке."
        />
        <MetricCard
          label="Завершенные этапы"
          value={String(dashboard.completedStages)}
          note="Этапы, по которым подписаны акты и оформлены финальные записи."
        />
        <MetricCard
          label="Инциденты безопасности"
          value={String(dashboard.safetyIncidents)}
          note="Зафиксированные события по безопасности, ожидающие или уже прошедшие обработку."
        />
        <MetricCard
          label="Отчеты за сегодня"
          value={String(dashboard.reportsToday)}
          note="Дневные отчеты осмотра, созданные за текущие сутки рабочего пространства."
        />
        <MetricCard
          label="Состояние портфеля"
          value={`${Math.round(
            dashboard.projects.length > 0
              ? dashboard.projects.reduce((sum, project) => sum + project.progressPercent, 0) / dashboard.projects.length
              : 0,
          )}%`}
          note="Средний прогресс проектов по всему портфелю."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel>
          <PanelHeader>
            <PanelTitle>Обзор прогресса проектов</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {dashboard.projects.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {dashboard.projects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{project.code}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{project.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{project.clientName}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {project.stageCount} этапов
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {project.memberCount} пользователей
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {project.floorPlanUrl ? "План готов" : "План отсутствует"}
                      </span>
                    </div>

                    <div className="mt-5">
                      <ProgressBar progress={project.progressPercent} />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Активные</p>
                        <p className="mt-1 font-medium text-slate-950">{project.activeStages}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Завершенные</p>
                        <p className="mt-1 font-medium text-slate-950">{project.completedStages}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Срок</p>
                        <p className="mt-1 font-medium text-slate-950">{formatDashboardDate(project.targetEndDate)}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">{describeDashboardProject(project)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Проекты отсутствуют"
                description="Создайте первый проект, чтобы начать строить портфельную панель."
                actionLabel="Создать проект"
                actionHref="/projects/new"
              />
            )}
          </PanelBody>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Ближайшие сроки</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {dashboard.upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950">{deadline.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{deadline.owner}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {deadline.project ? `${deadline.project.code} • ${deadline.project.name}` : "Проект не назначен"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatDashboardDate(deadline.due)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Сроки отсутствуют" description="В настоящее время нет приближающихся сроков активных этапов." />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Недавние нарушения безопасности</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {dashboard.recentSafetyViolations.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentSafetyViolations.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.project ? `${item.project.code} • ${item.project.name}` : "Проект неизвестен"}
                          </p>
                        </div>
                        <SeverityBadge severity={item.severity} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={item.status} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.reported_by_profile?.full_name ?? "Неизвестно"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Инциденты не зафиксированы"
                  description="Нарушения безопасности появятся здесь после отправки полевой командой."
                />
              )}
            </PanelBody>
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader>
            <PanelTitle>Недавние отчеты</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {dashboard.recentReports.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{report.summary}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {report.project ? `${report.project.code} • ${report.project.name}` : "Проект неизвестен"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {report.photo_count} фото
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{report.stage?.name ?? "Неизвестный этап"}</span>
                      <span>•</span>
                      <span>{report.reported_by_profile?.full_name ?? "Автор неизвестен"}</span>
                      <span>•</span>
                      <span>{formatDashboardDate(report.report_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Отчетов пока нет"
                description="Дневные осмотры появятся здесь, когда полевые команды начнут их отправлять."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Ключевые показатели</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Сводка по портфелю</p>
                <p className="mt-1">
                  Рабочее пространство отслеживает {dashboard.totalProjects} проектов, {dashboard.activeStages}
                  активных этапов и {dashboard.completedStages} завершенных передач.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Контроль безопасности</p>
                <p className="mt-1">
                  В рабочем пространстве зафиксировано {dashboard.safetyIncidents} инцидентов безопасности. Откройте
                  ленту безопасности для контроля со стороны прораба и отслеживания устранения.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Готовность к закрытию</p>
                <p className="mt-1">
                  Используйте сценарий завершения этапа, чтобы подписывать работы, генерировать акты и обновлять
                  прогресс проекта после завершения осмотров.
                </p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </section>
    </>
  );
}
