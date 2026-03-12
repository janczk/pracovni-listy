/**
 * Export utilities: JSON download, print, PDF (A4).
 */

import type { Worksheet } from "@/types/worksheet";
import { worksheetToQuizExport } from "@/services/quizExport";

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportWorksheetJson(worksheet: Worksheet): void {
  downloadJson(worksheet, `pracovni-list-${worksheet.id}.json`);
}

export function exportQuizJson(worksheet: Worksheet): void {
  const quiz = worksheetToQuizExport(worksheet);
  downloadJson(quiz, `kviz-${worksheet.id}.json`);
}

type PdfVariant = "student" | "teacher";

/**
 * Generuje a stáhne PDF (A4). variant "student" = list pro žáky, "teacher" = klíč pro učitele.
 */
export async function exportWorksheetPdf(
  worksheet: Worksheet,
  variant: PdfVariant
): Promise<void> {
  if (typeof window === "undefined") return;
  const React = await import("react");
  const { pdf } = await import("@react-pdf/renderer");
  const { WorksheetPdfDocument } = await import(
    "@/components/WorksheetPdfDocument"
  );
  const doc = React.createElement(WorksheetPdfDocument, { worksheet, variant });
  // pdf() očekává ReactElement<DocumentProps>; naše komponenta vrací <Document>…</Document>, typově to odpovídá za běhu
  const blob = await pdf(doc as React.ReactElement).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    variant === "student"
      ? `pracovni-list-zaci-${worksheet.id}.pdf`
      : `klic-odpovedi-ucitel-${worksheet.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Otevře dialog tisku. mode "student" = pouze pracovní list, "teacher" = pouze klíč odpovědí.
 * Před tiskem se na body nastaví třída print-student nebo print-teacher.
 */
export function triggerPrint(mode: "student" | "teacher"): void {
  if (typeof window === "undefined") return;
  document.body.classList.remove("print-student", "print-teacher");
  document.body.classList.add(mode === "student" ? "print-student" : "print-teacher");
  window.print();
  const cleanup = () => {
    document.body.classList.remove("print-student", "print-teacher");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
}
