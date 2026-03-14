import type { TaskType } from "@/types/worksheet";

export type TaskTypeLabels = Record<TaskType, string>;

export type WorksheetUiStrings = {
  nameLabel: string;
  yes: string;
  no: string;
  /** Slovo za číslem ročníku, např. "ročník" → "6. ročník" */
  gradeLabel: string;
  /** Nadpis klíče správných odpovědí pro učitele */
  answerKeyTitle: string;
};

const TASK_LABELS: Record<string, TaskTypeLabels> = {
  Čeština: {
    fill_in: "Doplňování",
    multiple_choice: "Výběr z možností",
    true_false: "Pravda / Nepravda",
    short_answer: "Krátká odpověď",
    reading_questions: "Otázky k textu",
    draw_picture: "Nakresli obrázek",
  },
  Angličtina: {
    fill_in: "Fill in",
    multiple_choice: "Multiple choice",
    true_false: "True / False",
    short_answer: "Short answer",
    reading_questions: "Reading comprehension",
    draw_picture: "Draw a picture",
  },
  Němčina: {
    fill_in: "Ergänzen",
    multiple_choice: "Multiple Choice",
    true_false: "Wahr / Falsch",
    short_answer: "Kurze Antwort",
    reading_questions: "Fragen zum Text",
    draw_picture: "Zeichne ein Bild",
  },
  Francouzština: {
    fill_in: "Compléter",
    multiple_choice: "QCM",
    true_false: "Vrai / Faux",
    short_answer: "Réponse courte",
    reading_questions: "Compréhension de texte",
    draw_picture: "Dessine une image",
  },
  Španělština: {
    fill_in: "Completar",
    multiple_choice: "Opción múltiple",
    true_false: "Verdadero / Falso",
    short_answer: "Respuesta breve",
    reading_questions: "Comprensión lectora",
    draw_picture: "Dibuja un dibujo",
  },
  Ukrajinština: {
    fill_in: "Доповнення",
    multiple_choice: "Вибір варіанту",
    true_false: "Правда / Неправда",
    short_answer: "Коротка відповідь",
    reading_questions: "Питання до тексту",
    draw_picture: "Накресли малюнок",
  },
};

const UI_STRINGS: Record<string, WorksheetUiStrings> = {
  Čeština: {
    nameLabel: "Jméno a příjmení:",
    yes: "Ano",
    no: "Ne",
    gradeLabel: "ročník",
    answerKeyTitle: "Klíč správných odpovědí",
  },
  Angličtina: {
    nameLabel: "Name:",
    yes: "Yes",
    no: "No",
    gradeLabel: "grade",
    answerKeyTitle: "Answer key",
  },
  Němčina: {
    nameLabel: "Name:",
    yes: "Ja",
    no: "Nein",
    gradeLabel: "Jahrgang",
    answerKeyTitle: "Lösungsschlüssel",
  },
  Francouzština: {
    nameLabel: "Nom et prénom :",
    yes: "Oui",
    no: "Non",
    gradeLabel: "année",
    answerKeyTitle: "Corrigé",
  },
  Španělština: {
    nameLabel: "Nombre y apellidos:",
    yes: "Sí",
    no: "No",
    gradeLabel: "curso",
    answerKeyTitle: "Soluciones",
  },
  Ukrajinština: {
    nameLabel: "Ім'я та прізвище:",
    yes: "Так",
    no: "Ні",
    gradeLabel: "клас",
    answerKeyTitle: "Ключ відповідей",
  },
};

const DEFAULT_TASK_LABELS: TaskTypeLabels = TASK_LABELS["Čeština"]!;
const DEFAULT_UI: WorksheetUiStrings = UI_STRINGS["Čeština"]!;

export function getTaskTypeLabels(language: string): TaskTypeLabels {
  return TASK_LABELS[language] ?? DEFAULT_TASK_LABELS;
}

export function getWorksheetUiStrings(language: string): WorksheetUiStrings {
  return UI_STRINGS[language] ?? DEFAULT_UI;
}

/** Formát řádku předmět · ročník (např. "Dějepis · 6. ročník") ve zvoleném jazyce */
export function formatSubjectGrade(
  language: string,
  subject: string,
  grade: string,
  classLabel?: string
): string {
  const ui = getWorksheetUiStrings(language);
  const part = `${grade}. ${ui.gradeLabel}`;
  return classLabel ? `${subject} · ${part}, ${classLabel}` : `${subject} · ${part}`;
}

/** Pro úlohy pravda/nepravda: vrátí překlad Ano/Ne podle jazyka */
export function formatTrueFalseForDisplay(value: string | undefined, language: string): string {
  const ui = getWorksheetUiStrings(language);
  const v = (value ?? "").trim().toLowerCase();
  if (v === "true" || v === "ano" || v === "yes" || v === "ja" || v === "oui" || v === "sí" || v === "так") return ui.yes;
  if (v === "false" || v === "ne" || v === "no" || v === "nein" || v === "non" || v === "ні") return ui.no;
  return value ?? "";
}

/** Pro zobrazení možnosti u úlohy pravda/nepravda: pokud je text true/false, zobraz v jazyce listu (Ano/Ne, Pravda/Nepravda). */
export function formatTrueFalseOptionDisplay(optionText: string, language: string): string {
  const v = (optionText ?? "").trim().toLowerCase();
  if (v === "true") return getWorksheetUiStrings(language).yes;
  if (v === "false") return getWorksheetUiStrings(language).no;
  return optionText;
}
