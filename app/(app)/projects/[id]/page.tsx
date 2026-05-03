import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RouteToast } from "@/components/ui/route-toast";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StageUpsertForm } from "@/components/stages/stage-form";
import { StageTimeline } from "@/components/stages/stage-timeline";
import { getProjectById } from "@/lib/projects/queries";
import { projectObjectTypes } from "@/lib/projects/validation";
import { createStageAction } from "@/lib/stages/actions";

type ProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    stageDeleted?: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: "bg-slate-100 text-slate-700",
    active: "bg-emerald-50 text-emerald-700",
    on_hold: "bg-amber-50 text-amber-700",
    completed: "bg-blue-50 text-blue-700",
    archived: "bg-slate-100 text-slate-500",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.planned}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-emerald-50 text-emerald-700",
    foreman: "bg-blue-50 text-blue-700",
    engineer: "bg-violet-50 text-violet-700",
    worker: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[role] ?? styles.worker}`}>
      {role}
    </span>
  );
}

function ObjectTypeBadge({ value }: { value: string }) {
  const label = projectObjectTypes.find((option) => option.value === value)?.label ?? value;

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: ProjectDetailsPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ created?: string; stageDeleted?: string }>({}),
  ]);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const created = resolvedSearchParams.created === "1";
  const stageDeleted = resolvedSearchParams.stageDeleted === "1";
  const primaryMembers = project.members.filter((member) => member.profile);
  const stageMembers = project.members
    .filter((member) => member.profile)
    .map((member) => member.profile!)
    .filter((member, index, array) => array.findIndex((item) => item.id === member.id) === index);

  return (
    <>
      {created ? (
        <RouteToast
          title="Проект создан"
          description="План этажа и ответственные пользователи сохранены."
          tone="success"
        />
      ) : null}

      {stageDeleted ? (
        <RouteToast title="Этап удален" description="Этап был удален из проекта." tone="info" />
      ) : null}

      <PageHeader
        eyebrow="Карточка проекта"
        title={project.name}
        description={`${project.location} • Заказчик: ${project.client_name}`}
        action={<StatusBadge status={project.status} />}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Тип объекта</p>
            <div className="mt-2">
              <ObjectTypeBadge value={project.object_type} />
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Прогресс</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{project.progress_percent}%</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Планируемое начало</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">
              {project.start_date ?? "Будет определено"}
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Планируемое окончание</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">
              {project.target_end_date ?? "Будет определено"}
            </div>
          </PanelBody>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel>
          <PanelHeader>
            <PanelTitle>Предпросмотр плана этажа</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {project.floor_plan_url ? (
              <div className="relative h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <Image
                  src={project.floor_plan_url}
                  alt={`План этажа проекта ${project.name}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <EmptyState
                title="План этажа не загружен"
                description="Загрузите первый план этажа в сценарии создания проекта, чтобы увидеть его здесь."
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {project.code}
              </span>
              {project.floor_plan_path ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  {project.floor_plan_path}
                </span>
              ) : null}
            </div>
          </PanelBody>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Ответственные пользователи</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {primaryMembers.length > 0 ? (
                <div className="space-y-3">
                  {primaryMembers.map((member) => (
                    <div key={member.profile_id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">{member.profile?.full_name}</p>
                          <p className="mt-1 text-sm text-slate-600">{member.profile?.email}</p>
                        </div>
                        <RoleBadge role={member.role} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Участники проекта не назначены"
                  description="Назначьте ответственных пользователей в сценарии создания или через инструменты управления проектом."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Описание</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {project.description ? (
                <p className="text-sm leading-6 text-slate-600">{project.description}</p>
              ) : (
                <EmptyState
                  title="Описание пока отсутствует"
                  description="Добавьте краткое описание объема работ или сводку по заказчику, чтобы помочь команде понять проект."
                />
              )}
            </PanelBody>
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader>
            <PanelTitle>Лента этапов</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {project.stages.length > 0 ? (
              <StageTimeline projectId={project.id} stages={project.stages} />
            ) : (
              <EmptyState
                title="Этапы пока не добавлены"
                description="Добавьте первый этап, чтобы запустить график проекта. Часто используются: электрика, сантехника и отделка."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Добавить этап</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <StageUpsertForm
              action={createStageAction}
              projectId={project.id}
              members={stageMembers}
              mode="create"
              submitLabel="Создать этап"
            />
          </PanelBody>
        </Panel>
      </section>
    </>
  );
}
