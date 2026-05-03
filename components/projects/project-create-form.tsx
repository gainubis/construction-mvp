"use client";

import { useActionState } from "react";
import { createProjectAction } from "@/lib/projects/actions";
import type { ProjectAssigneeOption, ProjectFormState } from "@/lib/projects/types";
import { projectObjectTypes } from "@/lib/projects/validation";
import { FieldShell } from "@/components/forms/field-shell";
import { CheckboxGroup } from "@/components/forms/checkbox-group";
import { FileInput, SelectInput, TextInput, TextareaInput } from "@/components/forms/inputs";

const initialState: ProjectFormState = {
  error: null,
  fieldErrors: {},
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Создание проекта..." : "Создать проект"}
    </button>
  );
}

type ProjectCreateFormProps = {
  assignees: ProjectAssigneeOption[];
};

export function ProjectCreateForm({ assignees }: ProjectCreateFormProps) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const defaultAssignees = assignees.slice(0, 2).map((user) => user.id);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FieldShell
          label="Название проекта"
          description="Публичное название, которое используется в отчетах, этапах и на панели."
          error={state.fieldErrors.name}
          required
        >
          <TextInput name="name" placeholder="Alpha Tower Renovation" autoComplete="off" />
        </FieldShell>

        <FieldShell
          label="Заказчик / владелец"
          description="Необязательное обозначение заказчика строительного объекта."
        >
          <TextInput name="clientName" placeholder="Prime Capital" autoComplete="off" />
        </FieldShell>

        <FieldShell
          label="Адрес"
          description="Адрес площадки или объекта."
          error={state.fieldErrors.address}
          required
        >
          <TextInput name="address" placeholder="Moscow, Tverskaya 12" autoComplete="street-address" />
        </FieldShell>

        <FieldShell
          label="Тип объекта"
          description="Выберите основной тип строительного объекта."
          error={state.fieldErrors.objectType}
          required
        >
          <SelectInput name="objectType" defaultValue="">
            <option value="" disabled>
              Выберите тип объекта
            </option>
            {projectObjectTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Планируемое начало"
          error={state.fieldErrors.startDate}
          required
        >
          <TextInput name="startDate" type="date" />
        </FieldShell>

        <FieldShell label="Планируемое окончание" error={state.fieldErrors.endDate} required>
          <TextInput name="endDate" type="date" />
        </FieldShell>
      </div>

      <FieldShell
        label="Ответственные пользователи"
        description="Назначьте пользователей, которые будут владеть проектом или курировать его."
        error={state.fieldErrors.responsibleUsers}
        required
      >
        <CheckboxGroup>
          {assignees.map((user) => {
            const isChecked = defaultAssignees.includes(user.id);

            return (
              <label
                key={user.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
              >
                <input
                  type="checkbox"
                  name="responsibleUsers"
                  value={user.id}
                  defaultChecked={isChecked}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                </div>
              </label>
            );
          })}
        </CheckboxGroup>
      </FieldShell>

      <FieldShell
        label="Загрузка плана этажа"
        description="PNG, JPG, or WebP up to 10 MB."
        error={state.fieldErrors.floorPlan}
        required
      >
        <FileInput name="floorPlan" type="file" accept="image/*" />
      </FieldShell>

      <FieldShell label="Примечания" description="Необязательная внутренняя заметка для команды проекта.">
        <TextareaInput name="description" placeholder="Краткий контекст, бюджетные или объемные заметки." />
      </FieldShell>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}
