import type { WorksheetTask } from "@/types/worksheet";

/**
 * Náhodně zamíchá pole (Fisher-Yates).
 */
function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Vrátí úlohy v náhodném pořadí; úlohy typu draw_picture (nakresli obrázek) jsou vždy na konci.
 */
export function randomizeTaskOrder(tasks: WorksheetTask[]): WorksheetTask[] {
  const drawPicture: WorksheetTask[] = [];
  const rest: WorksheetTask[] = [];
  for (const t of tasks) {
    if (t.type === "draw_picture") drawPicture.push(t);
    else rest.push(t);
  }
  return [...shuffle(rest), ...drawPicture];
}
