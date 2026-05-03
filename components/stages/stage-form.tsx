"use client";

import { useActionState, useState } from "react";
import type { StageAssigneeOption, StageFormState, StageRow, StageStatus } from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { SelectInput, TextInput, TextareaInput } from "@/components/forms/inputs";
import { commonStagePresets, stageStatusOptions } from "@/lib/stages/validation";

const initialState: StageFormState = {
  error: null,
  fieldErrors: {},
};

type StageUpsertFormProps = {
  action: (state: StageFormState, formData: FormData) => Promise<StageFormState>;
  projectId: string;
  members: StageAssigneeOption[];
  mode: "create" | "edit";
  submitLabel: string;
  stage?: StageRow | null;
};

function formatDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function StageUpsertForm({
  action,
  projectId,
  members,
  mode,
  submitLabel,
  stage,
}: StageUpsertFormProps) {
  const defaultResponsible = stage?.responsible_profile_id ?? members[0]?.id ?? "";
  const defaultName = stage?.name ?? "";
  const defaultDescription = stage?.notes ?? "";
  const defaultSequence = stage?.sequence ? String(stage.sequence) : "1";
  const defaultDeadline = stage?.planned_end_date ?? "";
  const defaultStatus = stage?.status ?? "planned";

  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [sequence, setSequence] = useState(defaultSequence);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [responsibleProfileId, setResponsibleProfileId] = useState(defaultResponsible);
  const [status, setStatus] = useState<StageStatus>(defaultStatus);
  const [state, formAction, pending] = useActionState(action, initialState);

  function applyPreset(presetKey: (typeof commonStagePresets)[number]["key"]) {
    const preset = commonStagePresets.find((item) => item.key === presetKey);
    if (!preset) {
      return;
    }

    setName(preset.name);
    setDescription(preset.description);
    setSequence(String(preset.sequence));
    setDeadline(formatDate(preset.deadlineOffsetDays));
    setStatus("planned");
    if (!responsibleProfileId && members[0]?.id) {
      setResponsibleProfileId(members[0].id);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      {stage ? <input type="hidden" name="stageId" value={stage.id} /> : null}

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      {mode === "create" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Быстрые шаблоны этапов</p>
          <div className="flex flex-wrap gap-2">
            {commonStagePresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FieldShell
          label="Название этапа"
          description="Используйте рабочую терминологию, соответствующую графику площадки."
          error={state.fieldErrors.name}
          required
        >
          <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Электромонтаж черновой" />
        </FieldShell>

        <FieldShell
          label="Порядок этапа"
          description="Определяет порядок этапов на странице проекта."
          error={state.fieldErrors.sequence}
          required
        >
          <TextInput
            value={sequence}
            onChange={(event) => setSequence(event.target.value)}
            type="number"
            min={1}
            step={1}
          />
        </FieldShell>

        <FieldShell
          label="Срок"
          description="Плановая дата завершения этого этапа."
          error={state.fieldErrors.deadline}
          required
        >
          <TextInput value={deadline} onChange={(event) => setDeadline(event.target.value)} type="date" />
        </FieldShell>

        <FieldShell
          label="Ответственный пользователь"
          description="Выберите участника команды, который отвечает за этот этап."
          error={state.fieldErrors.responsibleProfileId}
          required
        >
          <SelectInput
            value={responsibleProfileId}
            onChange={(event) => setResponsibleProfileId(event.target.value)}
          >
            <option value="" disabled>
              Выберите ответственного пользователя
            </option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} • {member.role}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Статус"
          description="Отражает текущее операционное состояние этапа."
          error={state.fieldErrors.status}
          required
        >
          <SelectInput value={status} onChange={(event) => setStatus(event.target.value as StageStatus)}>
            {stageStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>
      </div>

      <FieldShell
        label="Описание"
        description="Опишите объем работ, зависимости и критерии завершения."
        error={state.fieldErrors.description}
        required
      >
        <TextareaInput
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Черновой электромонтаж, подготовка щитов, установка подрозетников и первичная проверка."
        />
      </FieldShell>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Сохранение этапа..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
