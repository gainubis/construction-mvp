"use client";

import { useActionState } from "react";
import type { ChecklistItemFormState } from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { SelectInput, TextareaInput, TextInput } from "@/components/forms/inputs";
import { checklistItemTypeOptions } from "@/lib/stages/validation";

const initialState: ChecklistItemFormState = {
  error: null,
  fieldErrors: {},
};

type ChecklistItemFormProps = {
  action: (state: ChecklistItemFormState, formData: FormData) => Promise<ChecklistItemFormState>;
  projectId: string;
  stageId: string;
  checklistId: string;
};

export function ChecklistItemForm({ action, projectId, stageId, checklistId }: ChecklistItemFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />
      <input type="hidden" name="checklistId" value={checklistId} />

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <FieldShell
        label="Item title"
        description="Describe what the inspector should verify."
        error={state.fieldErrors.title}
        required
      >
        <TextInput name="title" placeholder="Cable trays installed and secured" />
      </FieldShell>

      <FieldShell label="Item description" description="Optional item-specific context.">
        <TextareaInput name="description" placeholder="Reference drawing set A-204 and MEP note 14." />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Item type" error={state.fieldErrors.itemType} required>
          <SelectInput name="itemType" defaultValue="boolean">
            {checklistItemTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell label="Expected value" description="Optional benchmark or tolerance.">
          <TextInput name="expectedValue" placeholder="Installed and tested" />
        </FieldShell>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isRequired"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
        />
        Required item
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Adding..." : "Add item"}
      </button>
    </form>
  );
}

