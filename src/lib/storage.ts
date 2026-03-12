import type { Worksheet } from "@/types/worksheet";

const STORAGE_KEY = "worksheet-generator-current";

/**
 * Ukládá worksheet do localStorage – data přežijí zavření záložky i prohlížeče.
 */
export function saveWorksheetToSession(worksheet: Worksheet): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(worksheet));
}

/**
 * Načte naposledy uložený worksheet z localStorage.
 */
export function getWorksheetFromSession(): Worksheet | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Worksheet;
  } catch {
    return null;
  }
}
