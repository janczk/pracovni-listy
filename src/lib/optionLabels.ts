/** Písmena pro varianty u výběru z možností (A, B, C, D, …) */
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getOptionLabel(index: number): string {
  if (index < 0 || index >= LETTERS.length) return String(index + 1);
  return LETTERS[index];
}

/** Odstraní případné ruční prefixy "A) ", "B) ", "C. " z textu možnosti. */
function stripExistingLabel(optionText: string): string {
  // Vzor: jedno velké písmeno + ) nebo . nebo : + mezera
  return optionText.replace(/^[A-Z][).:]\s+/, "");
}

/** Formát zobrazení varianty: "A) text možnosti" */
export function formatOptionWithLabel(index: number, optionText: string): string {
  const cleaned = stripExistingLabel(optionText);
  return `${getOptionLabel(index)}) ${cleaned}`;
}

/** Pro úlohy pravda/nepravda zobrazit česky */
export function formatTrueFalseAnswer(value: string): string {
  const v = value?.trim().toLowerCase();
  if (v === "true" || v === "ano") return "Ano";
  if (v === "false" || v === "ne") return "Ne";
  return value;
}

/**
 * Vrátí index správné odpovědi u multiple choice (porovnání textu),
 * nebo -1 pokud se neshoduje žádná možnost.
 */
export function getCorrectOptionIndex(
  options: string[],
  answer: string | string[]
): number {
  const answerStr = Array.isArray(answer) ? answer[0] : answer;
  if (answerStr == null) return -1;
  const normalized = answerStr.trim().toLowerCase();
  return options.findIndex(
    (opt) => opt.trim().toLowerCase() === normalized
  );
}
