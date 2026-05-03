"use client";

import { useActionState } from "react";
import type { ChecklistItemFormState } from "@/lib/projects/types";

const initialState: ChecklistItemFormState = {
  error: null,
  fieldErrors: {},
};

type ChecklistItemDeleteFormProps = {
  action: (state: ChecklistItemFormState, formData: FormData) => Promise<ChecklistItemFormState>;
  projectId: string;
  stageId: string;
  itemId: string;
};

export function ChecklistItemDeleteForm({ action, projectId, stageId, itemId }: ChecklistItemDeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />
      <input type="hidden" name="itemId" value={itemId} />

      {state.error ? <p className="text-xs text-rose-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Removing..." : "Remove"}
      </button>
    </form>
  );
}

