import type { SafetySeverity, SafetyStatus, SafetyViolationType, SafetyFormField } from "@/lib/projects/types";

export const safetyViolationTypeOptions: Array<{
  value: SafetyViolationType;
  label: string;
  description: string;
}> = [
  { value: "no_helmet", label: "No helmet", description: "Worker observed without head protection" },
  { value: "no_gloves", label: "No gloves", description: "Hands exposed during handling or transport" },
  { value: "unsafe_zone", label: "Unsafe zone", description: "Work activity in a restricted area" },
  { value: "improper_tool_storage", label: "Improper tool storage", description: "Tools left in an unsafe or cluttered condition" },
  { value: "blocked_passage", label: "Blocked passage", description: "Walkway or emergency access obstructed" },
];

export const safetySeverityOptions: Array<{
  value: SafetySeverity;
  label: string;
  description: string;
}> = [
  { value: "low", label: "Low", description: "Minor condition that still needs attention" },
  { value: "medium", label: "Medium", description: "Needs follow-up during the shift" },
  { value: "high", label: "High", description: "Work should pause until corrected" },
  { value: "critical", label: "Critical", description: "Immediate hazard requiring action now" },
];

export const safetyStatusOptions: Array<{
  value: SafetyStatus;
  label: string;
  description: string;
}> = [
  { value: "open", label: "Open", description: "Reported but not yet resolved" },
  { value: "in_review", label: "In review", description: "Assigned and being investigated" },
  { value: "resolved", label: "Resolved", description: "Corrective action complete" },
  { value: "dismissed", label: "Dismissed", description: "Reviewed and closed without action" },
];

export function isSafetyViolationType(value: string): value is SafetyViolationType {
  return safetyViolationTypeOptions.some((option) => option.value === value);
}

export function isSafetySeverity(value: string): value is SafetySeverity {
  return safetySeverityOptions.some((option) => option.value === value);
}

export function isSafetyStatus(value: string): value is SafetyStatus {
  return safetyStatusOptions.some((option) => option.value === value);
}

export function getSafetyViolationLabel(value: SafetyViolationType | string) {
  return safetyViolationTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getSafetyFormFieldMessage(field: SafetyFormField) {
  switch (field) {
    case "violationType":
      return "Choose a violation type.";
    case "severity":
      return "Choose a severity level.";
    case "status":
      return "Choose a status.";
    case "assignedTo":
      return "Assign a worker.";
    case "details":
      return "Add a comment or detail.";
    case "photos":
      return "Upload at least one photo.";
    default:
      return "This field is required.";
  }
}

export function getSafetyBadgeClasses(status: SafetyStatus | string) {
  switch (status) {
    case "open":
      return "bg-rose-50 text-rose-700";
    case "in_review":
      return "bg-amber-50 text-amber-700";
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
    case "dismissed":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getSeverityBadgeClasses(severity: SafetySeverity | string) {
  switch (severity) {
    case "low":
      return "bg-slate-100 text-slate-700";
    case "medium":
      return "bg-amber-50 text-amber-700";
    case "high":
      return "bg-rose-50 text-rose-700";
    case "critical":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
