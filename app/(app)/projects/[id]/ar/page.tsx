import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelBody } from "@/components/ui/panel";
import { ARPlanEditorShell } from "@/components/ar/ar-plan-editor-shell";
import { getProjectById } from "@/lib/projects/queries";
import { saveArPlanAction } from "@/lib/ar/actions";
import { getProjectArPlanById, getProjectArPlans } from "@/lib/ar/queries";

type ARPlanningPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    plan?: string;
    new?: string;
    created?: string;
    updated?: string;
  }>;
};

export default async function ARPlanningPage({ params, searchParams }: ARPlanningPageProps) {
  const [{ id }, search] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ plan?: string; new?: string; created?: string; updated?: string }>({}),
  ]);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const plans = await getProjectArPlans(project.id);
  const creatingNew = search.new === "1" || plans.length === 0;
  const selectedPlanId = !creatingNew
    ? search.plan && plans.some((plan) => plan.id === search.plan)
      ? search.plan
      : plans[0]?.id ?? null
    : null;
  const selectedPlan = selectedPlanId ? await getProjectArPlanById(project.id, selectedPlanId) : null;

  return (
    <>
      {search.created === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Wall plan created successfully.
        </div>
      ) : null}

      {search.updated === "1" ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Wall plan updated successfully.
        </div>
      ) : null}

      <PageHeader
        eyebrow="AR-lite planning"
        title="AR Planning"
        description="Upload a wall photo, place electrical markers, and reopen saved layouts later for quick edits."
        action={
          <Link
            href={creatingNew ? `/projects/${project.id}/ar${selectedPlanId ? `?plan=${selectedPlanId}` : ""}` : `/projects/${project.id}/ar?new=1`}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {creatingNew ? "Back to saved plan" : "New wall plan"}
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Saved plans</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{plans.length}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Active markers</p>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{selectedPlan?.marker_count ?? 0}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Linked stage</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">{selectedPlan?.stage?.name ?? "None"}</div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelBody>
            <p className="text-sm text-slate-500">Photo source</p>
            <div className="mt-2 text-xl font-semibold text-slate-950">{selectedPlan ? "Saved" : "Upload needed"}</div>
          </PanelBody>
        </Panel>
      </section>

      {creatingNew && plans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No wall plans are saved yet. Upload the first wall photo to start marking sockets, pipes, switches, and light points.
        </div>
      ) : null}

      <ARPlanEditorShell
        editorKey={selectedPlan?.id ?? "new"}
        projectId={project.id}
        projectName={project.name}
        stages={project.stages.map((stage) => ({ id: stage.id, name: stage.name }))}
        plans={plans}
        initialPlan={selectedPlan}
        action={saveArPlanAction}
        creatingNew={creatingNew}
      />
    </>
  );
}
