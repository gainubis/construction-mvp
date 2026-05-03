import type { StageFormField, StageStatus } from "@/lib/projects/types";

export const stageStatusOptions: Array<{
  value: StageStatus;
  label: string;
  description: string;
}> = [
  { value: "planned", label: "Planned", description: "Queued for the project schedule" },
  { value: "in_progress", label: "In progress", description: "Work is actively being executed" },
  { value: "review", label: "Review", description: "Ready for QA or internal inspection" },
  { value: "blocked", label: "Blocked", description: "Waiting on a dependency or decision" },
  { value: "complete", label: "Complete", description: "Stage finished and signed off" },
];

export const commonStagePresets = [
  {
    key: "electrical",
    name: "Electrical",
    description: "Rough-in wiring, outlets, breaker prep, and testing.",
    sequence: 1,
    deadlineOffsetDays: 10,
  },
  {
    key: "plumbing",
    name: "Plumbing",
    description: "Supply lines, drainage, fixtures, and leak testing.",
    sequence: 2,
    deadlineOffsetDays: 17,
  },
  {
    key: "finishing",
    name: "Finishing",
    description: "Paint, trim, fixtures, punch list, and final walkthrough.",
    sequence: 3,
    deadlineOffsetDays: 24,
  },
] as const;

export const checklistItemTypeOptions = [
  { value: "boolean", label: "Checkbox" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "photo", label: "Photo" },
] as const;

export const inspectionResultOptions = [
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "not_applicable", label: "Not applicable" },
] as const;

export function isStageStatus(value: string): value is StageStatus {
  return stageStatusOptions.some((option) => option.value === value);
}

export function getStageProgressForStatus(status: StageStatus) {
  switch (status) {
    case "planned":
      return 0;
    case "in_progress":
      return 35;
    case "review":
      return 75;
    case "blocked":
      return 40;
    case "complete":
      return 100;
    default:
      return 0;
  }
}

export function getStageStatusLabel(status: StageStatus) {
  return stageStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function getMissingStageFieldMessage(field: StageFormField) {
  switch (field) {
    case "name":
      return "Stage name is required.";
    case "description":
      return "Stage description is required.";
    case "sequence":
      return "Stage order is required.";
    case "deadline":
      return "Choose a stage deadline.";
    case "responsibleProfileId":
      return "Assign a responsible user.";
    case "status":
      return "Choose a stage status.";
    default:
      return "This field is required.";
  }
}

export function validateStageSequence(sequence: string) {
  const value = Number(sequence);

  if (!Number.isInteger(value) || value <= 0) {
    return "Stage order must be a positive whole number.";
  }

  return null;
}

export function isChecklistItemType(value: string) {
  return checklistItemTypeOptions.some((option) => option.value === value);
}

export function isInspectionResult(value: string) {
  return inspectionResultOptions.some((option) => option.value === value);
}
