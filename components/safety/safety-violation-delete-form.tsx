"use client";

import { useActionState } from "react";
import type { SafetyFormState } from "@/lib/projects/types";

const initialState: SafetyFormState = {
  error: null,
  fieldErrors: {},
};

type SafetyViolationDeleteFormProps = {
  action: (state: SafetyFormState, formData: FormData) => Promise<SafetyFormState>;
  projectId: string;
  violationId: string;
};

export function SafetyViolationDeleteForm({ action, projectId, violationId }: SafetyViolationDeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="violationId" value={violationId} />

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
        {pending ? "Deleting..." : "Delete violation"}
      </button>
    </form>
  );
}
