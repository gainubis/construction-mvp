import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/state/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { getProjectById } from "@/lib/projects/queries";
import { getProjectActs } from "@/lib/acts/queries";

type ActsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_signature: "bg-amber-50 text-amber-700",
    signed: "bg-emerald-50 text-emerald-700",
    archived: "bg-slate-100 text-slate-600",
    draft: "bg-slate-100 text-slate-700",
    canceled: "bg-rose-50 text-rose-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default async function ActsPage({ params }: ActsPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const acts = await getProjectActs(id);

  return (
    <>
      <PageHeader
        eyebrow="Закрытие"
        title={`${project.name} — акты`}
        description="Просматривайте завершенные акты этапов, данные подписанта и загружаемые PDF-записи."
        action={
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Назад к проекту
          </Link>
        }
      />

      <Panel>
        <PanelHeader>
          <PanelTitle>История сформированных актов</PanelTitle>
        </PanelHeader>
        <PanelBody>
          {acts.length > 0 ? (
            <div className="space-y-3">
              {acts.map((act) => (
                <div key={act.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{act.act_number}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {act.stage?.name ?? "Неизвестный этап"} | {act.signed_by_profile?.full_name ?? "Неизвестный подписант"}
                      </p>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Завершено</p>
                      <p className="mt-1 font-medium text-slate-950">{act.signed_at ?? "Ожидание"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Подготовил</p>
                      <p className="mt-1 font-medium text-slate-950">{act.prepared_by_profile?.full_name ?? "Неизвестно"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Сводка</p>
                      <p className="mt-1 line-clamp-2 font-medium text-slate-950">{act.summary ?? "Сводка отсутствует"}</p>
                    </div>
                  </div>
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
              title="Акты не сформированы"
              description="Когда этапы будут завершены, их подписанные PDF-акты появятся здесь."
              actionLabel="Назад к проекту"
              actionHref={`/projects/${id}`}
            />
          )}
        </PanelBody>
      </Panel>
    </>
  );
}
