import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectBrowser } from "@/components/projects/project-browser";
import { getProjectSummaries } from "@/lib/projects/queries";

export default async function ProjectsPage() {
  const projects = await getProjectSummaries();

  return (
    <>
      <PageHeader
        eyebrow="Портфель"
        title="Проекты"
        description="Создавайте и управляйте строительными объектами, планами этажей, командами этапов и прогрессом проектов."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Создать проект
          </Link>
        }
      />

      <ProjectBrowser projects={projects} />
    </>
  );
}
