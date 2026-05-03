"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  ProjectAssigneeOption,
  SafetyFormState,
  SafetyViolationDetail,
  SafetyViolationType,
} from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { FileInput, SelectInput, TextInput, TextareaInput } from "@/components/forms/inputs";
import { safetySeverityOptions, safetyStatusOptions, safetyViolationTypeOptions } from "@/lib/safety/validation";

const initialState: SafetyFormState = {
  error: null,
  fieldErrors: {},
};

type SafetyViolationFormProps = {
  action: (state: SafetyFormState, formData: FormData) => Promise<SafetyFormState>;
  projectId: string;
  assignees: ProjectAssigneeOption[];
  stages: Array<{
    id: string;
    name: string;
  }>;
  mode: "create" | "edit";
  submitLabel: string;
  violation?: SafetyViolationDetail | null;
  fixedStageId?: string | null;
};

export function SafetyViolationForm({
  action,
  projectId,
  assignees,
  stages,
  mode,
  submitLabel,
  violation,
  fixedStageId = null,
}: SafetyViolationFormProps) {
  const defaultViolationType = (violation?.violation_type ?? "no_helmet") as SafetyViolationType;
  const defaultSeverity = violation?.severity ?? "medium";
  const defaultStatus = violation?.status ?? "open";
  const defaultAssignedTo = violation?.assigned_to ?? assignees[0]?.id ?? "";
  const defaultStageId = fixedStageId ?? violation?.stage_id ?? stages[0]?.id ?? "";
  const defaultTitle = violation?.title ?? "";
  const defaultDetails = violation?.details ?? "";
  const defaultLocationNote = violation?.location_note ?? "";
  const suggestedTitle = useMemo(
    () =>
      defaultTitle ||
      safetyViolationTypeOptions.find((option) => option.value === defaultViolationType)?.label ||
      "Safety issue",
    [defaultTitle, defaultViolationType],
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [title, setTitle] = useState(defaultTitle || suggestedTitle);
  const [details, setDetails] = useState(defaultDetails);
  const [locationNote, setLocationNote] = useState(defaultLocationNote);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      {violation ? <input type="hidden" name="violationId" value={violation.id} /> : null}
      {fixedStageId ? <input type="hidden" name="stageId" value={fixedStageId} /> : null}

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FieldShell label="Issue title" description="A short label for the safety feed and notifications.">
          <TextInput
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={suggestedTitle}
          />
        </FieldShell>

        <FieldShell
          label="Violation type"
          description="Choose the predefined safety classification."
          error={state.fieldErrors.violationType}
          required
        >
          <SelectInput name="violationType" defaultValue={defaultViolationType}>
            {safetyViolationTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Severity"
          description="Escalate higher-risk conditions immediately."
          error={state.fieldErrors.severity}
          required
        >
          <SelectInput name="severity" defaultValue={defaultSeverity}>
            {safetySeverityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Status"
          description="Track the review and resolution state."
          error={state.fieldErrors.status}
        >
          <SelectInput name="status" defaultValue={defaultStatus}>
            {safetyStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Related worker"
          description="Assign the worker who should address the issue."
          error={state.fieldErrors.assignedTo}
          required
        >
          <SelectInput name="assignedTo" defaultValue={defaultAssignedTo}>
            <option value="" disabled>
              Select worker
            </option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name} - {person.role}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        {fixedStageId ? (
          <FieldShell label="Linked stage" description="This issue is captured from the current stage view.">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {stages.find((stage) => stage.id === fixedStageId)?.name ?? "Current stage"}
            </div>
          </FieldShell>
        ) : (
          <FieldShell label="Linked stage" description="Optionally attach the issue to a stage.">
            <SelectInput name="stageId" defaultValue={defaultStageId}>
              <option value="">No stage link</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FieldShell
          label="Location note"
          description="Optional area or room note for the field team."
        >
          <TextInput
            name="locationNote"
            value={locationNote}
            onChange={(event) => setLocationNote(event.target.value)}
            placeholder="North corridor, level 4"
          />
        </FieldShell>

        <FieldShell
          label="Photo evidence"
          description="Upload one or more photos from the site."
          error={state.fieldErrors.photos}
          required
        >
          <FileInput
            name="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              setSelectedFiles(Array.from(event.target.files ?? []).map((file) => file.name));
            }}
          />
        </FieldShell>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((fileName) => (
            <span
              key={fileName}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {fileName}
            </span>
          ))}
        </div>
      ) : null}

      <FieldShell
        label="Comment"
        description="Describe the issue, the immediate risk, and any corrective action."
        error={state.fieldErrors.details}
        required
      >
        <TextareaInput
          name="details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Worker was inside the active work zone without helmet protection during material handling."
        />
      </FieldShell>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (mode === "create" ? "Saving violation..." : "Updating violation...") : submitLabel}
        </button>
      </div>
    </form>
  );
}
