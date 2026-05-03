"use client";

import { useActionState } from "react";
import type { ChecklistFormState } from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { TextareaInput, TextInput } from "@/components/forms/inputs";

const initialState: ChecklistFormState = {
  error: null,
  fieldErrors: {},
};

type ChecklistCreateFormProps = {
  action: (state: ChecklistFormState, formData: FormData) => Promise<ChecklistFormState>;
  projectId: string;
  stageId: string;
};

export function ChecklistCreateForm({ action, projectId, stageId }: ChecklistCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <FieldShell
        label="Checklist name"
        description="Create a checklist for this stage."
        error={state.fieldErrors.name}
        required
      >
        <TextInput name="name" placeholder="Electrical rough-in checklist" />
      </FieldShell>

      <FieldShell label="Checklist notes" description="Optional context for the team.">
        <TextareaInput name="description" placeholder="Inspection scope, reference drawings, and approvals." />
      </FieldShell>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Creating..." : "Create checklist"}
      </button>
    </form>
  );
}

