import type { GenerationConfig, ResponseSchema } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";

/** Schema pro výstup generování pracovního listu (tasks array). */
export const WORKSHEET_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          answer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ["type", "question"],
      },
    },
  },
  required: ["tasks"],
};

/** Společná generationConfig pro generování listů: stabilní výstup, JSON, limit tokenů. */
export const WORKSHEET_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 1200,
  responseMimeType: "application/json",
  responseSchema: WORKSHEET_RESPONSE_SCHEMA,
};

/** Konfigurace pro SVP zjednodušení (také JSON, kratší výstup). */
export const SVP_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 1200,
  responseMimeType: "application/json",
  responseSchema: WORKSHEET_RESPONSE_SCHEMA,
};

/** Konfigurace pro regeneraci jedné úlohy (bez schema – volný text nebo jednoduchý JSON dle potřeby). */
export const REGENERATE_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 400,
};

/** Popis typů úloh – pouze ty s count > 0 se vloží do promptu. */
export const TASK_TYPE_LINES: Record<string, string> = {
  multiple_choice: "multiple_choice: výběr z možností A-D, přesně 3–4 možnosti.",
  true_false:
    'true_false: tvrzení s dvěma možnostmi a správnou odpovědí. Možnosti i odpověď piš VŽDY ve zvoleném jazyce (např. v češtině "Pravda"/"Nepravda" nebo "Ano"/"Ne", nikdy anglické true/false).',
  fill_in: "fill_in: doplňovačka s jedním krátkým slovem nebo rokem.",
  short_answer: "short_answer: krátká otevřená odpověď (1–2 věty).",
  reading_questions: "reading_questions: otázky k textu bez nutnosti dalšího textu.",
  draw_picture:
    'draw_picture: úloha, kde má žák něco NAKRESLIT (schéma, obrázek). Formuluj otázku tak, aby výstupem byl nákres. Pole "answer" nech prázdné.',
};

/**
 * Vrátí řádky popisů typů úloh pouze pro ty typy, které mají v taskTypeCounts počet > 0.
 */
export function getTaskTypeLinesForPrompt(taskTypeCounts: Record<string, number>): string[] {
  return (Object.keys(TASK_TYPE_LINES) as string[])
    .filter((type) => (taskTypeCounts[type] ?? 0) > 0)
    .map((type) => `- ${TASK_TYPE_LINES[type]}`);
}

/** Krátké LMP-specifické doplnění system instruction (~50 tokenů). */
export const LMP_SYSTEM_APPENDIX =
  "Pro LMP: velmi jednoduchý jazyk, krátké věty (max cca 10 slov), jedna otázka = jedna informace. Náročnost cca o 1–2 ročníky níže. Preferuj rozpoznání a doplnění; u otevřených úloh jen jednoduché konkrétní otázky, odpověď max 1 věta.";

/** Pro LMP: kratší popisy typů (pouze odlišné od TASK_TYPE_LINES). */
const TASK_TYPE_LINES_LMP: Partial<Record<string, string>> = {
  multiple_choice: "multiple_choice: 3–4 krátké možnosti, jednoduchý jazyk.",
  fill_in: "fill_in: jen jedno slovo nebo rok.",
  short_answer: "short_answer: pro LMP jen jedna jednoduchá otázka, odpověď max 1 věta.",
  reading_questions: "reading_questions: pro LMP jen jednoduchá konkrétní otázka, odpověď max 1 věta.",
  draw_picture: 'draw_picture: jednoduchá úloha – žák něco nakreslí. Pole "answer" prázdné.',
};

/**
 * Pro LMP: řádky popisů typů úloh (kratší, LMP-specifické). Typy s count > 0.
 */
export function getTaskTypeLinesForLmp(taskTypeCounts: Record<string, number>): string[] {
  return (Object.keys(TASK_TYPE_LINES) as string[])
    .filter((type) => (taskTypeCounts[type] ?? 0) > 0)
    .map((type) => `- ${TASK_TYPE_LINES_LMP[type] ?? TASK_TYPE_LINES[type]}`);
}
