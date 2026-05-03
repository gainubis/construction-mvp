export const ACT_PDF_BUCKET = "act-pdfs";

export function buildActPdfPath(projectId: string, stageId: string, actId: string) {
  return `projects/${projectId}/stages/${stageId}/acts/${actId}.pdf`;
}

