import type { InspectionResultValue } from "@/lib/projects/types";

export type InspectionSummaryHealthStatus = "healthy" | "watch" | "at_risk" | "critical";

export type InspectionSummaryChecklistItem = {
  title: string;
  status: InspectionResultValue;
  comment: string | null;
  itemType: string;
  isRequired: boolean;
};

export type InspectionSummaryInput = {
  projectName: string;
  stageName: string;
  checklistItems: InspectionSummaryChecklistItem[];
  inspectorComment: string;
  detectedIssuesText?: string | null;
  photoCount: number;
};

export type InspectionSummaryOutput = {
  summary: string;
  identifiedIssues: string[];
  recommendations: string[];
  overallStageHealthStatus: InspectionSummaryHealthStatus;
  suggestedNextAction: string;
};

export const inspectionSummarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      minLength: 1,
      description: "Short field-ready summary of the inspection result.",
    },
    identifiedIssues: {
      type: "array",
      description: "Concise list of the main issues identified in the inspection.",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      description: "Practical recommendations for the crew or supervisor.",
      items: { type: "string" },
    },
    overallStageHealthStatus: {
      type: "string",
      enum: ["healthy", "watch", "at_risk", "critical"],
    },
    suggestedNextAction: {
      type: "string",
      minLength: 1,
      description: "Single next step that should happen after the inspection.",
    },
  },
  required: [
    "summary",
    "identifiedIssues",
    "recommendations",
    "overallStageHealthStatus",
    "suggestedNextAction",
  ],
} as const;

export function buildInspectionSummarySystemPrompt() {
  return [
    "You are an operations assistant for a construction project management platform.",
    "Write concise, practical inspection summaries for site supervisors.",
    "Base conclusions only on the provided inspection context.",
    "Do not invent facts, trade details, or measurements that are not in the input.",
    "Prioritize safety, quality, and next-step clarity.",
    "Return JSON that matches the supplied schema exactly.",
  ].join(" ");
}

function formatChecklistItem(item: InspectionSummaryChecklistItem, index: number) {
  const comment = item.comment ? ` | note: ${item.comment}` : "";

  return `${index + 1}. [${item.status}] ${item.title} (${item.itemType}${item.isRequired ? ", required" : ", optional"})${comment}`;
}

export function buildInspectionSummaryUserPrompt(input: InspectionSummaryInput) {
  const checklistLines =
    input.checklistItems.length > 0
      ? input.checklistItems.map((item, index) => formatChecklistItem(item, index)).join("\n")
      : "No checklist items were provided.";

  const detectedIssues = input.detectedIssuesText?.trim() || "No additional detected issues were provided.";

  return [
    `Project: ${input.projectName}`,
    `Stage: ${input.stageName}`,
    `Uploaded photos: ${input.photoCount}`,
    "",
    "Checklist results:",
    checklistLines,
    "",
    "Inspector comment:",
    input.inspectorComment || "No inspector comment was provided.",
    "",
    "Detected issues text:",
    detectedIssues,
    "",
    "Instructions:",
    "- Write a short summary focused on the field situation.",
    "- List concrete issues only when evidence exists in the input.",
    "- Keep recommendations actionable and site-ready.",
    "- If the stage looks healthy, say so clearly without sounding generic.",
    "- Suggested next action should be one direct action for the responsible team.",
  ].join("\n");
}

export function composeInspectionSummaryText(summary: InspectionSummaryOutput) {
  const issues = summary.identifiedIssues.length > 0 ? summary.identifiedIssues.map((issue) => `- ${issue}`).join("\n") : "- No material issues identified.";
  const recommendations =
    summary.recommendations.length > 0
      ? summary.recommendations.map((item) => `- ${item}`).join("\n")
      : "- Continue routine monitoring and close out the inspection record.";

  return [
    `Summary: ${summary.summary}`,
    `Health status: ${summary.overallStageHealthStatus.replace("_", " ")}`,
    "",
    "Identified issues:",
    issues,
    "",
    "Recommendations:",
    recommendations,
    "",
    `Suggested next action: ${summary.suggestedNextAction}`,
  ].join("\n");
}
