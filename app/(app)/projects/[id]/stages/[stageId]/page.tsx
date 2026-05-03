import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { RouteToast } from "@/components/ui/route-toast";
import { ChecklistCreateForm } from "@/components/stages/checklist-create-form";
import { ChecklistItemDeleteForm } from "@/components/stages/checklist-item-delete-form";
import { ChecklistItemForm } from "@/components/stages/checklist-item-form";
import { DailyInspectionForm } from "@/components/stages/daily-inspection-form";
import { StageDeleteForm } from "@/components/stages/stage-delete-form";
import { StageUpsertForm } from "@/components/stages/stage-form";
import { SafetyViolationForm } from "@/components/safety/safety-violation-form";
import { getProjectById } from "@/lib/projects/queries";
import { deleteStageAction, updateStageAction } from "@/lib/stages/actions";
import {
  addChecklistItemAction,
  createChecklistAction,
  deleteChecklistItemAction,
} from "@/lib/stages/inspection-actions";
import { getStageDetail } from "@/lib/stages/queries";
import { createSafetyViolationAction } from "@/lib/safety/actions";

type StageDetailPageProps = {
  params: Promise<{
    id: string;
    stageId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    completed?: string;
    actId?: string;
    inspectionSubmitted?: string;
    aiSummaryFailed?: string;
    checklistCreated?: string;
    checklistItemCreated?: string;
    checklistItemDeleted?: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: "bg-slate-100 text-slate-700",
    in_progress: "bg-emerald-50 text-emerald-700",
    review: "bg-blue-50 text-blue-700",
    blocked: "bg-amber-50 text-amber-700",
    complete: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.planned}`}>
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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  );
}

export default async function StageDetailPage({ params, searchParams }: StageDetailPageProps) {
  const [{ id, stageId }, search] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const resolvedSearchParams = search as {
    created?: string;
    updated?: string;
    completed?: string;
    actId?: string;
    inspectionSubmitted?: string;
    aiSummaryFailed?: string;
    checklistCreated?: string;
    checklistItemCreated?: string;
    checklistItemDeleted?: string;
  };
  const stage = await getStageDetail(id, stageId);
  const project = stage ? await getProjectById(stage.project_id) : null;

  if (!stage) {
    notFound();
  }

  const currentMembers = project?.members
    .filter((member) => member.profile)
    .map((member) => member.profile!)
    .filter((member, index, array) => array.findIndex((item) => item.id === member.id) === index) ?? [];
  const latestReport = stage.reports[0];

  return (
    <>
      {resolvedSearchParams.created === "1" ? (
        <RouteToast title="Этап создан" description="Новый этап сохранен." tone="success" />
      ) : null}

      {resolvedSearchParams.updated === "1" ? (
        <RouteToast title="Этап обновлен" description="Данные этапа сохранены." tone="info" />
      ) : null}

      {resolvedSearchParams.completed === "1" ? (
        <RouteToast
          title="Этап завершен"
          description={
            resolvedSearchParams.actId
              ? "Подписанный акт сформирован и сохранен."
              : "Этап завершен."
          }
          tone="success"
        />
      ) : null}

      {resolvedSearchParams.inspectionSubmitted === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Дневной осмотр успешно отправлен.
        </div>
      ) : null}

      {resolvedSearchParams.aiSummaryFailed === "1" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Осмотр сохранен, но AI-сводку не удалось создать. Повторите попытку на странице отчета.
        </div>
      ) : null}

      {resolvedSearchParams.checklistCreated === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Чек-лист привязан к этапу.
        </div>
      ) : null}

      {resolvedSearchParams.checklistItemCreated === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Пункт чек-листа добавлен.
        </div>
      ) : null}

      {resolvedSearchParams.checklistItemDeleted === "1" ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Пункт чек-листа удален.
        </div>
      ) : null}

      <PageHeader
        eyebrow="Управление этапом"
        title={stage.name}
        description={`${stage.project.name} | Ответственный: ${stage.responsible_profile?.full_name ?? "Не назначен"}`}
        action={
          <>
            {stage.status !== "complete" && latestReport && stage.checklist?.items.length ? (
              <Link
                href={`/projects/${stage.project_id}/stages/${stage.id}/complete`}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Завершить этап
              </Link>
            ) : null}
            <StatusBadge status={stage.status} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Порядок этапа</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{stage.sequence}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Срок</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">{stage.planned_end_date ?? "Будет определено"}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Прогресс</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{stage.progress_percent}%</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Чек-лист</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">{stage.checklist?.name ?? "Не привязан"}</div>
          </PanelBody>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Сводка этапа</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm leading-6 text-slate-600">{stage.notes ?? "Описание не указано."}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Проект</p>
                  <p className="mt-1 font-medium text-slate-950">{stage.project.name}</p>
                  <p className="text-sm text-slate-500">{stage.project.location}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ответственный</p>
                  <p className="mt-1 font-medium text-slate-950">
                    {stage.responsible_profile?.full_name ?? "Не назначен"}
                  </p>
                  <p className="text-sm text-slate-500">{stage.responsible_profile?.email ?? "Профиль отсутствует"}</p>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Начать дневной осмотр</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {stage.checklist?.items.length ? (
                <DailyInspectionForm
                  projectId={stage.project_id}
                  stageId={stage.id}
                  checklistItems={stage.checklist.items}
                />
              ) : (
                <EmptyState
                  title="Чек-лист не привязан"
                  description="Создайте и привяжите чек-лист перед запуском дневного осмотра."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Управление чек-листом</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-6">
                <ChecklistCreateForm action={createChecklistAction} projectId={stage.project_id} stageId={stage.id} />

                {stage.checklist ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-medium text-slate-950">{stage.checklist.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{stage.checklist.description ?? "Описание отсутствует."}</p>
                    </div>

                    {stage.checklist.items.length > 0 ? (
                      <div className="space-y-3">
                        {stage.checklist.items.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-950">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {item.description ?? "Детали не указаны."}
                                </p>
                              </div>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                                {item.item_type}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                  {item.is_required ? "Обязательно" : "Необязательно"}
                                </span>
                                {item.expected_value ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                    Ожидается: {item.expected_value}
                                  </span>
                                ) : null}
                              </div>
                              <ChecklistItemDeleteForm
                                action={deleteChecklistItemAction}
                                projectId={stage.project_id}
                                stageId={stage.id}
                                itemId={item.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Пункты чек-листа пока не добавлены"
                        description="Добавьте пункты, чтобы полевая команда могла проводить структурированный осмотр."
                      />
                    )}

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <h3 className="text-base font-semibold text-slate-950">Добавить пункт чек-листа</h3>
                      <div className="mt-4">
                        <ChecklistItemForm
                          action={addChecklistItemAction}
                          projectId={stage.project_id}
                          stageId={stage.id}
                          checklistId={stage.checklist.id}
                        />
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Зафиксировать проблему безопасности</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <SafetyViolationForm
                action={createSafetyViolationAction}
                projectId={stage.project_id}
                assignees={currentMembers}
                stages={[{ id: stage.id, name: stage.name }]}
                mode="create"
                submitLabel="Создать нарушение"
                fixedStageId={stage.id}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>История отчетов</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {stage.reports.length > 0 ? (
                <div className="space-y-3">
                  {stage.reports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">
                            {report.summary || "Отчет осмотра"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Автор: {report.reported_by_profile?.full_name ?? "Неизвестно"} | {report.report_date} |{" "}
                            {report.created_at}
                          </p>
                        </div>
                        <StatusBadge status={report.status} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Состояние</p>
                          <p className="mt-1 font-medium text-slate-950">{report.health_score}/100</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Прогресс</p>
                          <p className="mt-1 font-medium text-slate-950">
                            {report.progress_before ?? 0}% {"->"} {report.progress_after ?? 0}%
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Фото</p>
                          <p className="mt-1 font-medium text-slate-950">{report.photo_count}</p>
                        </div>
                      </div>
                      {report.ai_summary_text ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI-сводка</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{report.ai_summary_text}</p>
                        </div>
                      ) : null}
                      {report.inspector_comments ? (
                        <p className="mt-4 text-sm leading-6 text-slate-600">{report.inspector_comments}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/projects/${stage.project_id}/reports/${report.id}`}
                          className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Просмотреть полный отчет
                        </Link>
                        {report.ai_generation_error ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Доступна повторная генерация AI
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Отчетов пока нет"
                  description="Отправленные дневные осмотры появятся здесь с отметками времени и именами авторов."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Сформированные акты</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {stage.acts.length > 0 ? (
                <div className="space-y-3">
                  {stage.acts.map((act) => (
                    <div key={act.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">{act.act_number}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {act.signed_by_profile?.full_name ?? "Неизвестно"} | {act.signed_at ?? "Ожидание подписи"}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {act.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{act.summary ?? "Сводка не записана."}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {act.pdf_url ? (
                          <>
                            <a
                              href={act.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                              Просмотреть PDF
                            </a>
                            <a
                              href={act.pdf_url}
                              download
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Скачать
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Акты пока отсутствуют"
                  description="Когда этап будет завершен, подписанный акт появится здесь со ссылкой на PDF."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Связанные инциденты безопасности</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {stage.safety_violations.length > 0 ? (
                <div className="space-y-3">
                  {stage.safety_violations.map((incident) => (
                    <div key={incident.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">{incident.title}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {incident.reported_by_profile?.full_name ?? "Неизвестно"} |{" "}
                            {incident.location_note ?? "Без примечания к месту"}
                          </p>
                        </div>
                        <SeverityBadge severity={incident.severity} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {incident.status.replace("_", " ")}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Назначено: {incident.assigned_to_profile?.full_name ?? "Не назначено"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Инцидентов безопасности нет"
                  description="Нарушения безопасности и корректирующие действия появятся здесь после их регистрации на этом этапе."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Закрытие этапа</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/projects/${stage.project_id}/stages/${stage.id}/complete`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="block text-base font-semibold text-slate-950">Завершить этап</span>
                  <span className="mt-1 block text-sm text-slate-600">Проверьте финальный отчет, подпишите акт и закройте этап.</span>
                </Link>
                <Link
                  href={`/projects/${stage.project_id}/acts`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="block text-base font-semibold text-slate-950">История актов</span>
                  <span className="mt-1 block text-sm text-slate-600">Откройте ранее сформированные PDF-акты для этого проекта.</span>
                </Link>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Редактировать этап</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <StageUpsertForm
                action={updateStageAction}
                projectId={stage.project_id}
                members={currentMembers}
                mode="edit"
                submitLabel="Сохранить изменения"
                stage={stage}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Удалить этап</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm leading-6 text-slate-600">
                Удаление этого этапа удалит связанные отчеты, инциденты, акты, AR-планы и данные чек-листов.
              </p>
              <StageDeleteForm action={deleteStageAction} projectId={stage.project_id} stageId={stage.id} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Ссылка на проект</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <Link
                href={`/projects/${stage.project_id}`}
                className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Назад к проекту
              </Link>
            </PanelBody>
          </Panel>
        </div>
      </section>
    </>
  );
}
