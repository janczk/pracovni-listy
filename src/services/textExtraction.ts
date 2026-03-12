/**
 * Extrakce textu z obrázků (OCR) a PDF.
 * Obrázky: zmenšení + předzpracování (šedá, kontrast) + Tesseract.js.
 * OCR ignoruje lépe fotografie a pracuje hlavně s textem; výstup se dále čistí od šumu.
 */

import { resizeImageForOcr, preprocessImageForOcr, isImageFile } from "@/lib/imageResize";

export interface ExtractedContent {
  text: string;
  pageCount?: number;
  fileName?: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type) || isImageFile(file);
}

/** Znaky typické pro šum z obrázků / layoutu (sloupce, rámečky). */
const GARBAGE_CHARS = /[\|=©~\[\]{}<>%€§]/g;
/** Povolená interpunkce a mezery v běžném textu. */
const ALLOWED_PUNCT = /[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\s.,;:!?\-–—„“\"\'()]/g;

/**
 * Odstraní z výstupu OCR řádky, které vypadají jako šum z obrázků a layoutu.
 * Ponechá jen řádky, které vypadají jako normální věty (převaha písmen, minimum symbolů).
 */
function cleanOcrText(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim().replace(/\s+/g, " ");
    if (!trimmed || trimmed.length < 4) continue;

    const letterLike = (trimmed.match(ALLOWED_PUNCT) ?? []).join("");
    const letterRatio = letterLike.length / trimmed.length;
    const garbageCount = (trimmed.match(GARBAGE_CHARS) ?? []).length;

    if (garbageCount >= 2) continue;
    if (garbageCount >= 1 && letterRatio < 0.82) continue;
    if (letterRatio < 0.68) continue;
    if (trimmed.length <= 6 && letterRatio < 0.95) continue;

    out.push(trimmed);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extrahuje text z nahraných souborů.
 * - Obrázky: zmenšení, předzpracování (šedá + kontrast), OCR (Tesseract, čeština + angličtina, PSM AUTO),
 *   poté čištění výstupu od šumu z obrázků a fotografií.
 * - PDF: zatím mock.
 */
export async function extractSourceTextFromFiles(
  files: File[]
): Promise<ExtractedContent> {
  const parts: string[] = [];
  const imageFiles = files.filter(isImage);
  const hasPdf = files.some((f) => f.type === "application/pdf");

  if (imageFiles.length > 0) {
    const Tesseract = await import("tesseract.js");
    const { createWorker, PSM } = Tesseract.default;
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const resizedBlob = await resizeImageForOcr(file);
      const preprocessedBlob = await preprocessImageForOcr(resizedBlob);
      const imageUrl = URL.createObjectURL(preprocessedBlob);
      let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
      try {
        worker = await createWorker("ces+eng", 1, {
          logger: () => {},
        });
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
        });
        const { data } = await worker.recognize(imageUrl);
        const raw = (data?.text ?? "").trim();
        const text = cleanOcrText(raw);
        parts.push(`[Stránka ${i + 1} – ${file.name}]\n${text}`);
      } finally {
        if (worker) await worker.terminate();
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  if (hasPdf) {
    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    for (const pdf of pdfFiles) {
      parts.push(`[PDF – ${pdf.name}]\n${await getPdfPlaceholderText(pdf)}`);
    }
  }

  return {
    text: parts.join("\n\n"),
    pageCount: files.length,
    fileName: files.map((f) => f.name).join(", "),
  };
}

/**
 * PDF: zatím placeholder. V produkci lze použít pdf.js (getTextContent pro textové PDF
 * nebo vykreslení stránek na canvas + OCR pro skenované PDF) – vše lze dělat v prohlížeči.
 */
async function getPdfPlaceholderText(_pdf: File): Promise<string> {
  return (
    "[PDF – pro rozpoznání textu z PDF nahrajte prosím snímky stránek jako obrázky, " +
    "nebo bude tato funkce doplněna.]"
  );
}
