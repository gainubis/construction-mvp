"use client";

import { useActionState } from "react";
import type { StageFormState } from "@/lib/projects/types";

const initialState: StageFormState = {
  error: null,
  fieldErrors: {},
};

type StageDeleteFormProps = {
  action: (state: StageFormState, formData: FormData) => Promise<StageFormState>;
  projectId: string;
  stageId: string;
};

export function StageDeleteForm({ action, projectId, stageId }: StageDeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Deleting..." : "Delete stage"}
      </button>
    </form>
  );
}

