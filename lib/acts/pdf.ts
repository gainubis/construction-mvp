import {
  PDFDocument,
  type PDFFont,
  StandardFonts,
  type PDFPage,
  rgb,
} from "pdf-lib";
import type { ProfileSummary, StageDetail, StageReportDetail } from "@/lib/projects/types";

type BuildActPdfInput = {
  actNumber: string;
  stage: StageDetail;
  report: StageReportDetail;
  preparedBy: ProfileSummary;
  signedBy: ProfileSummary;
  finalComments: string;
  signatureDataUrl: string;
  signedAt: string;
};

function decodeDataUrl(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");

  if (!meta?.startsWith("data:image/png;base64") || !base64) {
    throw new Error("Signature image is invalid.");
  }

  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

function drawWrappedText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color = rgb(0.12, 0.15, 0.2),
  lineHeight = 1.4,
) {
  const lines = wrapText(font, text, size, width);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * size * lineHeight,
      size,
      font,
      color,
    });
  });

  return y - lines.length * size * lineHeight;
}

function drawKeyValue(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  boldFont: PDFFont,
) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 8,
    font: boldFont,
    color: rgb(0.47, 0.53, 0.63),
  });

  drawWrappedText(page, font, value, x, y - 12, width, 10, rgb(0.08, 0.11, 0.16));
}

function drawSectionHeader(
  page: PDFPage,
  title: string,
  x: number,
  y: number,
  width: number,
  boldFont: PDFFont,
) {
  page.drawRectangle({
    x,
    y: y - 6,
    width,
    height: 20,
    color: rgb(0.95, 0.97, 0.99),
    borderColor: rgb(0.84, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText(title, {
    x: x + 10,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.08, 0.11, 0.16),
  });
}

export async function buildStageActPdf(input: BuildActPdfInput) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const margin = 40;
  const contentWidth = 595.28 - margin * 2;
  let cursorY = 800;

  const drawPageHeader = (isContinuation: boolean) => {
    page.drawRectangle({
      x: 0,
      y: isContinuation ? 790 : 760,
      width: 595.28,
      height: isContinuation ? 51.89 : 81.89,
      color: rgb(0.08, 0.11, 0.16),
    });

    page.drawText("Construction Completion Act", {
      x: margin,
      y: isContinuation ? 815 : 800,
      size: isContinuation ? 16 : 22,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(input.actNumber, {
      x: margin,
      y: isContinuation ? 799 : 780,
      size: 11,
      font: helvetica,
      color: rgb(0.88, 0.92, 0.98),
    });

    page.drawText(`Signed ${formatDateTime(input.signedAt)}`, {
      x: 430,
      y: isContinuation ? 807 : 788,
      size: 10,
      font: helvetica,
      color: rgb(0.88, 0.92, 0.98),
    });
  };

  const addContinuationPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    drawPageHeader(true);
    cursorY = 746;
  };

  drawPageHeader(false);
  cursorY = 736;

  drawSectionHeader(page, "Project and stage", margin, cursorY, contentWidth, helveticaBold);
  cursorY -= 32;

  const colWidth = (contentWidth - 16) / 2;
  drawKeyValue(page, "Project", `${input.stage.project?.name ?? input.stage.project_id} - ${input.stage.project?.code ?? ""}`.trim(), margin, cursorY, colWidth, helvetica, helveticaBold);
  drawKeyValue(page, "Stage", `${input.stage.name} (Order ${input.stage.sequence})`, margin + colWidth + 16, cursorY, colWidth, helvetica, helveticaBold);
  cursorY -= 38;
  drawKeyValue(page, "Prepared by", `${input.preparedBy.full_name} (${input.preparedBy.role})`, margin, cursorY, colWidth, helvetica, helveticaBold);
  drawKeyValue(page, "Signed by", `${input.signedBy.full_name} (${input.signedBy.role})`, margin + colWidth + 16, cursorY, colWidth, helvetica, helveticaBold);
  cursorY -= 38;
  drawKeyValue(page, "Inspection date", formatDateTime(input.report.report_date), margin, cursorY, colWidth, helvetica, helveticaBold);
  drawKeyValue(page, "Health score", `${input.report.health_score}/100`, margin + colWidth + 16, cursorY, colWidth, helvetica, helveticaBold);
  cursorY -= 44;

  drawSectionHeader(page, "Final review summary", margin, cursorY, contentWidth, helveticaBold);
  cursorY -= 30;

  const results = input.report.inspection_results;
  const passed = results.filter((item) => item.result === "passed").length;
  const failed = results.filter((item) => item.result === "failed").length;
  const naCount = results.filter((item) => item.result === "not_applicable").length;

  drawKeyValue(page, "Items", `${results.length}`, margin, cursorY, 120, helvetica, helveticaBold);
  drawKeyValue(page, "Passed", `${passed}`, margin + 135, cursorY, 120, helvetica, helveticaBold);
  drawKeyValue(page, "Failed", `${failed}`, margin + 270, cursorY, 120, helvetica, helveticaBold);
  drawKeyValue(page, "N/A", `${naCount}`, margin + 405, cursorY, 120, helvetica, helveticaBold);
  cursorY -= 42;

  drawSectionHeader(page, "Checklist results", margin, cursorY, contentWidth, helveticaBold);
  cursorY -= 30;

  results.forEach((item, index) => {
    if (cursorY < 180) {
      addContinuationPage();
      drawSectionHeader(page, "Checklist results (continued)", margin, cursorY, contentWidth, helveticaBold);
      cursorY -= 30;
    }

    const title = item.checklist_item?.title ?? `Item ${index + 1}`;
    const status = item.result.replace("_", " ");
    const comment = item.comment ? ` - ${item.comment}` : "";
    const line = `${index + 1}. ${title} - ${status}${comment}`;
    cursorY = drawWrappedText(page, helvetica, line, margin + 8, cursorY, contentWidth - 16, 10, rgb(0.12, 0.15, 0.2), 1.35) - 8;
  });

  cursorY -= 8;

  if (cursorY < 180) {
    addContinuationPage();
  }

  drawSectionHeader(page, "Final comments", margin, cursorY, contentWidth, helveticaBold);
  cursorY -= 28;
  cursorY = drawWrappedText(
    page,
    helvetica,
    input.finalComments,
    margin + 8,
    cursorY,
    contentWidth - 16,
    10,
    rgb(0.12, 0.15, 0.2),
    1.4,
  ) - 12;

  if (cursorY < 180) {
    addContinuationPage();
  }

  drawSectionHeader(page, "Signature", margin, cursorY, contentWidth, helveticaBold);
  cursorY -= 22;

  const signatureImage = await pdf.embedPng(decodeDataUrl(input.signatureDataUrl));
  const signatureWidth = 180;
  const signatureHeight = (signatureImage.height / signatureImage.width) * signatureWidth;

  page.drawRectangle({
    x: margin,
    y: cursorY - signatureHeight - 24,
    width: contentWidth,
    height: signatureHeight + 40,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.84, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText("Signed electronically by", {
    x: margin + 12,
    y: cursorY - 6,
    size: 8,
    font: helveticaBold,
    color: rgb(0.47, 0.53, 0.63),
  });
  page.drawText(input.signedBy.full_name, {
    x: margin + 12,
    y: cursorY - 20,
    size: 12,
    font: helveticaBold,
    color: rgb(0.08, 0.11, 0.16),
  });
  page.drawText(input.signedBy.role, {
    x: margin + 12,
    y: cursorY - 34,
    size: 9,
    font: helvetica,
    color: rgb(0.47, 0.53, 0.63),
  });
  page.drawImage(signatureImage, {
    x: 360,
    y: cursorY - signatureHeight - 10,
    width: signatureWidth,
    height: signatureHeight,
  });

  page.drawText("This act confirms the stage completion review and digital signature approval.", {
    x: margin,
    y: 26,
    size: 8,
    font: helveticaOblique,
    color: rgb(0.47, 0.53, 0.63),
  });

  return await pdf.save();
}
