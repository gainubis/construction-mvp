"use client";

import { useActionState, useState } from "react";
import type { ChecklistItemRow, InspectionFormState } from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { SelectInput, TextareaInput } from "@/components/forms/inputs";
import { submitInspectionAction } from "@/lib/stages/inspection-actions";
import { inspectionResultOptions } from "@/lib/stages/validation";

const initialState: InspectionFormState = {
  error: null,
  fieldErrors: {},
  itemErrors: {},
};

type DailyInspectionFormProps = {
  projectId: string;
  stageId: string;
  checklistItems: ChecklistItemRow[];
};

export function DailyInspectionForm({ projectId, stageId, checklistItems }: DailyInspectionFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(submitInspectionAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <FieldShell
          label="Загрузка фото"
          description="Загрузите одно или несколько фото осмотра с площадки."
          error={state.fieldErrors.photos}
          required
        >
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <input
              type="file"
              name="photos"
              accept="image/*"
              multiple
              onChange={(event) => {
                setSelectedFiles(Array.from(event.target.files ?? []).map((file) => file.name));
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <p className="mt-3 text-xs text-slate-500">
              Фотографии сохраняются в Supabase Storage и связываются с этим отчетом осмотра.
            </p>
            {selectedFiles.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFiles.map((fileName) => (
                  <span
                    key={fileName}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    {fileName}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </FieldShell>

        <FieldShell
          label="Комментарии инспектора"
          description="Кратко опишите результаты, блокеры и следующие действия."
          error={state.fieldErrors.inspectorComments}
          required
        >
          <TextareaInput
            name="inspectorComments"
            placeholder="Бригада завершила черновой электромонтаж в северном коридоре; два розеточных узла нужно перепроверить перед подписанием."
          />
        </FieldShell>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Панель чек-листа</h3>
            <p className="mt-1 text-sm text-slate-500">
              Отметьте каждый пункт, добавьте необязательное примечание и отправьте форму после завершения осмотра.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {checklistItems.length} пунктов
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {checklistItems.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description ?? "Описание не указано."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {item.item_type}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {item.is_required ? "Обязательно" : "Необязательно"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.7fr_1fr]">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Результат
                  </span>
                  <SelectInput name={`result_${item.id}`} defaultValue="">
                    <option value="" disabled>
                      Выберите результат
                    </option>
                    {inspectionResultOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  {state.itemErrors[item.id] ? (
                    <p className="mt-2 text-sm text-rose-600">{state.itemErrors[item.id]}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Примечание по пункту
                  </span>
                  <TextareaInput
                    name={`comment_${item.id}`}
                    placeholder="Необязательное наблюдение по пункту."
                    className="min-h-[92px]"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Отправка осмотра..." : "Отправить осмотр"}
        </button>
      </div>
    </form>
  );
}
