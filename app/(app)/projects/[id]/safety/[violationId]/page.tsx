import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { SafetyViolationDeleteForm } from "@/components/safety/safety-violation-delete-form";
import { SafetyViolationForm } from "@/components/safety/safety-violation-form";
import { getProjectById } from "@/lib/projects/queries";
import { deleteSafetyViolationAction, updateSafetyViolationAction } from "@/lib/safety/actions";
import { getSafetyViolationById } from "@/lib/safety/queries";
import { getSafetyEvidenceUrl } from "@/lib/safety/storage";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSeverityBadgeClasses, getSafetyBadgeClasses, getSafetyViolationLabel } from "@/lib/safety/validation";

type SafetyViolationDetailPageProps = {
  params: Promise<{
    id: string;
    violationId: string;
  }>;
};

export default async function SafetyViolationDetailPage({ params }: SafetyViolationDetailPageProps) {
  const { id, violationId } = await params;
  const [violation, project] = await Promise.all([getSafetyViolationById(id, violationId), getProjectById(id)]);
  const { isConfigured } = getSupabaseConfig();

  if (!violation || !project) {
    notFound();
  }

  const assignees =
    project.members
      .filter((member) => Boolean(member.profile))
      .map((member) => member.profile!)
      .filter((member, index, array) => array.findIndex((item) => item.id === member.id) === index) ?? [];

  const stages = project.stages.map((stage) => ({ id: stage.id, name: stage.name }));

  return (
    <>
      <PageHeader
        eyebrow="Нарушение безопасности"
        title={violation.title}
        description={`${project.name} | ${getSafetyViolationLabel(violation.violation_type)} | ${violation.severity}`}
        action={
          <Link
            href={`/projects/${project.id}/safety`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Назад к ленте безопасности
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Статус</p>
            <div className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSafetyBadgeClasses(violation.status)}`}>
                {violation.status.replace("_", " ")}
              </span>
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Серьезность</p>
            <div className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeClasses(violation.severity)}`}>
                {violation.severity}
              </span>
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Назначено</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {violation.assigned_to_profile?.full_name ?? "Не назначено"}
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Фото</p>
            <div className="mt-2 text-lg font-semibold text-slate-950">{violation.photos.length}</div>
          </PanelBody>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Детали нарушения</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Тип" value={getSafetyViolationLabel(violation.violation_type)} />
                <DetailItem label="Этап" value={violation.stage?.name ?? "Без привязки к этапу"} />
                <DetailItem label="Рабочий" value={violation.assigned_to_profile?.full_name ?? "Не назначен"} />
                <DetailItem label="Сообщил" value={violation.reported_by_profile?.full_name ?? "Неизвестно"} />
                <DetailItem label="Локация" value={violation.location_note ?? "Без примечания"} />
                <DetailItem label="Время" value={violation.occurred_at} />
              </div>

              {violation.details ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Комментарий</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{violation.details}</p>
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Фото-доказательства</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {violation.photos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {violation.photos.map((photo) => (
                    <figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="relative h-44 w-full">
                        <Image
                          src={isConfigured ? getSafetyEvidenceUrl(photo.storage_path) : "/window.svg"}
                          alt={photo.caption ?? "Фото доказательства"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <figcaption className="px-4 py-3 text-xs text-slate-500">
                        {photo.caption ?? "Фото доказательства"}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Для этого нарушения фото-доказательства не загружены.</p>
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Редактировать нарушение</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <SafetyViolationForm
                action={updateSafetyViolationAction}
                projectId={project.id}
                assignees={assignees}
                stages={stages}
                mode="edit"
                submitLabel="Сохранить изменения"
                violation={violation}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Удалить нарушение</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm leading-6 text-slate-600">
                Удаление этого нарушения также удалит его фото-доказательства и связанные уведомления.
              </p>
              <div className="mt-4">
                <SafetyViolationDeleteForm
                  action={deleteSafetyViolationAction}
                  projectId={project.id}
                  violationId={violation.id}
                />
              </div>
            </PanelBody>
          </Panel>
        </div>
      </section>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
