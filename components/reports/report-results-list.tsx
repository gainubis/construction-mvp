import type { InspectionChecklistResult } from "@/lib/projects/types";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";

type ReportResultsListProps = {
  results: InspectionChecklistResult[];
};

function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    passed: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
    not_applicable: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[result] ?? styles.not_applicable}`}>
      {result.replace("_", " ")}
    </span>
  );
}

export function ReportResultsList({ results }: ReportResultsListProps) {
  return (
    <Panel>
      <PanelHeader>
      <PanelTitle>Сырые результаты чек-листа</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{result.checklist_item?.title ?? "Пункт чек-листа"}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {result.checklist_item?.description ?? "Описание пункта чек-листа отсутствует."}
                    </p>
                  </div>
                  <ResultBadge result={result.result} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Примечание по пункту</p>
                    <p className="mt-1 text-sm text-slate-700">{result.comment ?? "Примечание по пункту не записано."}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Данные пункта</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {result.checklist_item?.item_type ?? "Неизвестно"} | {result.checklist_item?.is_required ? "Обязательно" : "Необязательно"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Для этого отчета результаты чек-листа не записаны.</p>
        )}
      </PanelBody>
    </Panel>
  );
}
