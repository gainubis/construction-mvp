import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";

export default function StageCompletionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-1/2 rounded-2xl bg-slate-200" />
      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-3xl bg-slate-200" />
        ))}
      </section>
      <Panel>
        <PanelHeader>
          <PanelTitle>Loading completion review</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <div className="h-80 rounded-3xl bg-slate-100" />
        </PanelBody>
      </Panel>
    </div>
  );
}
