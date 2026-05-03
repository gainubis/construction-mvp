import Link from "next/link";
import type { ProjectStageSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { getStageStatusLabel } from "@/lib/stages/validation";

type StageTimelineProps = {
  projectId: string;
  stages: ProjectStageSummary[];
};

function StageStatusBadge({ status }: { status: ProjectStageSummary["status"] }) {
  const styles: Record<ProjectStageSummary["status"], string> = {
    planned: "bg-slate-100 text-slate-700",
    in_progress: "bg-emerald-50 text-emerald-700",
    review: "bg-blue-50 text-blue-700",
    blocked: "bg-amber-50 text-amber-700",
    complete: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", styles[status])}>
      {getStageStatusLabel(status)}
    </span>
  );
}

function StageProgressBar({ value }: { value: number }) {
  const filledSegments = Math.max(0, Math.min(10, Math.round(value / 10)));

  return (
    <div className="grid h-2 grid-cols-10 gap-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className={cn("rounded-full", index < filledSegments ? "bg-emerald-500" : "bg-slate-200")}
        />
      ))}
    </div>
  );
}

export function StageTimeline({ projectId, stages }: StageTimelineProps) {
  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <article
          key={stage.id}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                {stage.sequence}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Этап {stage.sequence}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{stage.name}</h3>
              </div>
            </div>

            <StageStatusBadge status={stage.status} />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">{stage.notes ?? "Описание не указано."}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Ответственный</p>
              <p className="mt-1 font-medium text-slate-900">
                {stage.responsible_profile?.full_name ?? "Не назначен"}
              </p>
              <p className="text-sm text-slate-500">{stage.responsible_profile?.role ?? "Участник команды"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Срок</p>
              <p className="mt-1 font-medium text-slate-900">{stage.planned_end_date ?? "Будет определено"}</p>
              <p className="text-sm text-slate-500">{stage.checklist ? stage.checklist.name : "Чек-лист не привязан"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Прогресс</p>
              <p className="mt-1 font-medium text-slate-900">{stage.progress_percent}%</p>
              <div className="mt-2">
                <StageProgressBar value={stage.progress_percent} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {stage.responsible_profile ? "Команда назначена" : "Требуется назначение"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {stage.checklist ? "Чек-лист привязан" : "Чек-лист не привязан"}
              </span>
            </div>
            <Link
              href={`/projects/${projectId}/stages/${stage.id}`}
              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Открыть этап
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
