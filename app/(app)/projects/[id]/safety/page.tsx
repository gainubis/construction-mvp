import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { SafetyViolationForm } from "@/components/safety/safety-violation-form";
import { getProjectById } from "@/lib/projects/queries";
import { createSafetyViolationAction } from "@/lib/safety/actions";
import { getProjectSafetyViolations } from "@/lib/safety/queries";
import {
  getSafetyBadgeClasses,
  getSeverityBadgeClasses,
  safetySeverityOptions,
  safetyStatusOptions,
  safetyViolationTypeOptions,
} from "@/lib/safety/validation";

type SafetyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    violationType?: string;
    status?: string;
    severity?: string;
    stageId?: string;
  }>;
};

export default async function SafetyPage({ params, searchParams }: SafetyPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const filters = search as {
    created?: string;
    updated?: string;
    deleted?: string;
    violationType?: string;
    status?: string;
    severity?: string;
    stageId?: string;
  };

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const violations = await getProjectSafetyViolations(project.id, {
    violationType: filters.violationType,
    status: filters.status,
    severity: filters.severity,
  });

  const assignees =
    project.members
      .filter((member) => Boolean(member.profile))
      .map((member) => member.profile!)
      .filter((member, index, array) => array.findIndex((item) => item.id === member.id) === index) ?? [];

  const stages = project.stages.map((stage) => ({ id: stage.id, name: stage.name }));
  const selectedStageId =
    filters.stageId && stages.some((stage) => stage.id === filters.stageId) ? filters.stageId : null;

  const openViolations = violations.filter((violation) => violation.status === "open" || violation.status === "in_review");
  const criticalViolations = violations.filter((violation) => violation.severity === "critical" || violation.severity === "high");
  const currentFilters = {
    violationType: filters.violationType,
    status: filters.status,
    severity: filters.severity,
  };

  return (
    <>
      {filters.created === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Нарушение безопасности успешно создано.
        </div>
      ) : null}

      {filters.updated === "1" ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Нарушение безопасности успешно обновлено.
        </div>
      ) : null}

      {filters.deleted === "1" ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Нарушение безопасности удалено.
        </div>
      ) : null}

      <PageHeader
        eyebrow="Контроль безопасности"
        title={`${project.name} — безопасность`}
        description="Фиксируйте инциденты на площадке, назначайте корректирующие действия, отслеживайте доказательства и информируйте прораба."
        action={
          <Link
            href="#log-issue"
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Зафиксировать нарушение
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Открытые случаи</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{openViolations.length}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Высокий приоритет</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{criticalViolations.length}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Охваченные этапы</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{stages.length}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Назначенные рабочие</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{assignees.length}</div>
          </PanelBody>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section id="log-issue">
            <Panel>
              <PanelHeader>
                <PanelTitle>Зафиксировать проблему безопасности</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <SafetyViolationForm
                  action={createSafetyViolationAction}
                  projectId={project.id}
                  assignees={assignees}
                  stages={stages}
                  mode="create"
                  submitLabel="Создать нарушение"
                  fixedStageId={selectedStageId}
                />
              </PanelBody>
            </Panel>
          </section>

          <Panel>
            <PanelHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PanelTitle>Лента безопасности</PanelTitle>
                <p className="text-sm text-slate-500">Отфильтрованная временная шкала проекта</p>
              </div>
            </PanelHeader>
            <PanelBody>
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <FilterChip
                  label="Тип"
                  options={safetyViolationTypeOptions}
                  value={filters.violationType}
                  baseHref={`/projects/${project.id}/safety`}
                  paramName="violationType"
                  currentFilters={currentFilters}
                />
                <FilterChip
                  label="Статус"
                  options={safetyStatusOptions}
                  value={filters.status}
                  baseHref={`/projects/${project.id}/safety`}
                  paramName="status"
                  currentFilters={currentFilters}
                />
                <FilterChip
                  label="Серьезность"
                  options={safetySeverityOptions}
                  value={filters.severity}
                  baseHref={`/projects/${project.id}/safety`}
                  paramName="severity"
                  currentFilters={currentFilters}
                />
              </div>

              {violations.length > 0 ? (
                <div className="space-y-3">
                  {violations.map((violation) => (
                    <div key={violation.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeClasses(violation.severity)}`}>
                              {violation.severity}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSafetyBadgeClasses(violation.status)}`}>
                              {violation.status.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-950">{violation.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {violation.stage?.name ?? "Без привязки к этапу"} | {violation.reported_by_profile?.full_name ?? "Неизвестно"}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {violation.photos_count} фото
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">{violation.details ?? "Комментарий не указан."}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            Рабочий: {violation.assigned_to_profile?.full_name ?? "Не назначен"}
                          </span>
                          {violation.location_note ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                              {violation.location_note}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            {violation.occurred_at}
                          </span>
                        </div>

                        <Link
                          href={`/projects/${project.id}/safety/${violation.id}`}
                          className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Просмотреть детали
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Нарушения не соответствуют текущим фильтрам"
                  description="Создайте новое нарушение или измените фильтры, чтобы просмотреть текущую ленту."
                />
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Стол прораба</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-3">
                {violations
                  .filter((violation) => violation.status === "open" || violation.status === "in_review")
                  .slice(0, 4)
                  .map((violation) => (
                    <div key={violation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-medium text-slate-950">{violation.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {violation.severity} | {violation.stage?.name ?? "Без этапа"} | {violation.assigned_to_profile?.full_name ?? "Не назначен"}
                      </p>
                    </div>
                  ))}

                {violations.filter((violation) => violation.status === "open" || violation.status === "in_review").length === 0 ? (
                  <EmptyState
                    title="Активных задач безопасности нет"
                    description="Открытые проблемы будут отображаться здесь, чтобы прораб мог сосредоточиться на последних рисках."
                  />
                ) : null}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Быстрые ссылки</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="grid gap-3">
                {stages.map((stage) => (
                  <Link
                    key={stage.id}
                    href={`/projects/${project.id}/stages/${stage.id}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {stage.name}
                  </Link>
                ))}
              </div>
            </PanelBody>
          </Panel>
        </div>
      </section>
    </>
  );
}

function FilterChip({
  label,
  options,
  value,
  baseHref,
  paramName,
  currentFilters,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  baseHref: string;
  paramName: string;
  currentFilters: Record<string, string | undefined>;
}) {
  function buildHref(nextValue?: string) {
    const params = new URLSearchParams();

    Object.entries(currentFilters).forEach(([key, currentValue]) => {
      if (currentValue && key !== paramName) {
        params.set(key, currentValue);
      }
    });

    if (nextValue) {
      params.set(paramName, nextValue);
    }

    const query = params.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={buildHref(undefined)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            !value ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          Все
        </Link>
        {options.map((option) => (
          <Link
            key={option.value}
            href={buildHref(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              value === option.value ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
