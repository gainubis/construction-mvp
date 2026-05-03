import { PageHeader } from "@/components/layout/page-header";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { getProjectAssigneeOptions } from "@/lib/projects/queries";

export default async function NewProjectPage() {
  const assignees = await getProjectAssigneeOptions();

  return (
    <>
      <PageHeader
        eyebrow="Проекты"
        title="Создание проекта"
        description="Зарегистрируйте новый строительный объект, назначьте ответственных пользователей и загрузите план этажа в одном сценарии."
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <ProjectCreateForm assignees={assignees} />
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Сценарий создания
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">Что сохраняется</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Метаданные проекта и поля сроков в Supabase Postgres.</li>
            <li>Изображение плана этажа, загруженное в Supabase Storage.</li>
            <li>
              Ответственные пользователи, сохраненные в <code className="rounded bg-white/10 px-1.5 py-0.5">project_members</code>.
            </li>
            <li>Страница проекта открывается сразу после создания.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
