"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectSummary } from "@/lib/projects/types";
import { projectObjectTypes } from "@/lib/projects/validation";
import { cn } from "@/lib/utils";

type ProjectBrowserProps = {
  projects: ProjectSummary[];
};

const statusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "planned", label: "Запланирован" },
  { value: "active", label: "Активен" },
  { value: "on_hold", label: "Приостановлен" },
  { value: "completed", label: "Завершен" },
  { value: "archived", label: "Архив" },
];

type ViewMode = "cards" | "table";

function StatusBadge({ status }: { status: ProjectSummary["status"] }) {
  const styles: Record<ProjectSummary["status"], string> = {
    planned: "bg-slate-100 text-slate-700",
    active: "bg-emerald-50 text-emerald-700",
    on_hold: "bg-amber-50 text-amber-700",
    completed: "bg-blue-50 text-blue-700",
    archived: "bg-slate-100 text-slate-500",
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", styles[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

function ObjectTypeBadge({ value }: { value: ProjectSummary["objectType"] }) {
  const label = projectObjectTypes.find((item) => item.value === value)?.label ?? value;

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}

function ProjectProgressBar({ value }: { value: number }) {
  const filledSegments = Math.max(0, Math.min(10, Math.round(value / 10)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-500">Прогресс</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="grid h-2 grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-full",
              index < filledSegments ? "bg-emerald-500" : "bg-slate-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ProjectBrowser({ projects }: ProjectBrowserProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [objectType, setObjectType] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const filteredProjects = projects.filter((project) => {
    const searchableText = [
      project.code,
      project.name,
      project.clientName,
      project.location,
      project.objectType,
      project.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = searchableText.includes(query.trim().toLowerCase());
    const matchesStatus = status === "all" || project.status === status;
    const matchesObjectType = objectType === "all" || project.objectType === objectType;

    return matchesQuery && matchesStatus && matchesObjectType;
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
        <label className="block">
          <span className="sr-only">Поиск проектов</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, коду, адресу или заказчику"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300"
          />
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={objectType}
          onChange={(event) => setObjectType(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300"
        >
          <option value="all">Все типы объектов</option>
          {projectObjectTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          {(["cards", "table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                viewMode === mode ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {mode === "cards" ? "Карточки" : "Таблица"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-900 shadow-sm ring-1 ring-slate-200">
          {filteredProjects.length} проектов
        </span>
        <span>{projects.filter((project) => project.status === "active").length} активных</span>
        <span>{projects.filter((project) => project.status === "planned").length} запланированных</span>
        <span>{projects.filter((project) => project.floorPlanUrl).length} загруженных планов</span>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-600">
          <p className="text-lg font-semibold text-slate-900">Совпадающих проектов нет</p>
          <p className="mt-2 text-sm">
            Попробуйте другой запрос или сбросьте фильтры, чтобы увидеть все объекты.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {project.code}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{project.name}</h3>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ObjectTypeBadge value={project.objectType} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.memberCount} users
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.stageCount} stages
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-900">{project.clientName}</p>
                  <p className="mt-1 leading-6">{project.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Начало</p>
                    <p className="mt-1 font-medium text-slate-900">{project.startDate ?? "Будет определено"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Окончание</p>
                    <p className="mt-1 font-medium text-slate-900">{project.targetEndDate ?? "Будет определено"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <ProjectProgressBar value={project.progressPercent} />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  План этажа {project.floorPlanUrl ? "загружен" : "отсутствует"}
                </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Открыть проект
                  </Link>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                      <th className="px-5 py-4 font-medium">Проект</th>
                      <th className="px-5 py-4 font-medium">Тип</th>
                      <th className="px-5 py-4 font-medium">Статус</th>
                      <th className="px-5 py-4 font-medium">Сроки</th>
                      <th className="px-5 py-4 font-medium">Прогресс</th>
                <th className="px-5 py-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="bg-white">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-950">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.clientName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ObjectTypeBadge value={project.objectType} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                      <div>
                      {project.startDate ?? "Будет определено"} до {project.targetEndDate ?? "Будет определено"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-40">
                      <ProjectProgressBar value={project.progressPercent} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
