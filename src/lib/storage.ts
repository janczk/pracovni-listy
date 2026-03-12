import type { Worksheet } from "@/types/worksheet";

const STORAGE_KEY = "worksheet-generator-current";

type Stored = {
  main: Worksheet;
  simplified?: Worksheet;
};

/**
 * Ukládá worksheet do localStorage. Při volbě „Zjednodušená verze“ uloží obě sady (main + simplified).
 */
export function saveWorksheetToSession(
  worksheet: Worksheet,
  simplifiedWorksheet?: Worksheet | null
): void {
  if (typeof window === "undefined") return;
  const payload: Stored = {
    main: worksheet,
    ...(simplifiedWorksheet ? { simplified: simplifiedWorksheet } : {}),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Načte uložené listy. Zpětná kompatibilita: pokud je uložen starý formát (jeden Worksheet),
 * vrátí ho jako main a simplifiedWorksheet null.
 */
export function getWorksheetFromSession(): {
  worksheet: Worksheet | null;
  simplifiedWorksheet: Worksheet | null;
} {
  if (typeof window === "undefined") {
    return { worksheet: null, simplifiedWorksheet: null };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { worksheet: null, simplifiedWorksheet: null };
  try {
    const parsed = JSON.parse(raw);
    // Starý formát: uložen přímo Worksheet (má pole tasks)
    if (Array.isArray(parsed?.tasks)) {
      return { worksheet: parsed as Worksheet, simplifiedWorksheet: null };
    }
    return {
      worksheet: parsed.main ?? null,
      simplifiedWorksheet: parsed.simplified ?? null,
    };
  } catch {
    return { worksheet: null, simplifiedWorksheet: null };
  }
}
