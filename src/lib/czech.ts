/**
 * České popisky a možnosti pro učitele.
 * Hodnoty (value) zůstávají v kódu anglické kvůli kompatibilitě s API a typům.
 */

import type { OutputType, TaskType, Difficulty, UseCase } from "@/types/worksheet";

export const TEXTS = {
  appTitle: "Generátor pracovních listů",
  appSubtitle: "Vytvořte pracovní list nebo otázky k porozumění textu během chvíle. Zvolte způsob tvorby.",

  home: "Domů",
  backToHome: "← Zpět na úvod",
  createFromTopic: "Vytvořit z tématu",
  createFromTextbook: "Vytvořit z učebnice",

  createFromTopicTitle: "Vytvořit z tématu",
  createFromTopicDesc: "Zadejte předmět, ročník a téma. Aplikace vygeneruje pracovní list nebo otázky k porozumění textu.",

  createFromTextbookTitle: "Vytvořit z učebnice",
  createFromTextbookDesc: "Nahrajte 1–5 fotek stránek z učebnice nebo PDF. Z obsahu vytvoříme úlohy.",

  schoolType: "Typ školy",
  subject: "Předmět",
  grade: "Ročník",
  classLabel: "Třída",
  classLabelPlaceholder: "např. 6.B",
  language: "Jazyk",
  topic: "Téma",
  outputType: "Typ výstupu",
  taskTypes: "Typy úloh",
  numberOfTasks: "Počet úloh",
  questionsPerType: "Počet otázek",
  difficulty: "Obtížnost",
  intendedUse: "Účel použití",
  includeAnswers: "Zobrazit odpovědi v náhledu",
  simplifiedVersion: "Přidat verzi pracovního listu pro žáky s SVP (zjednodušená verze)",
  /** Pro LMP: pouze velké písmo, bez „pro SVP“. */
  allCapsLmp: "Pracovní list velkým písmenem",
  /** Pro běžnou ZŠ při SVP verzi. */
  allCapsForSvp: "Pracovní list velkým písmenem (pro žáky s SVP)",

  uploadFiles: "Nahrát soubory",
  uploadFilesHint: "Obrázky (JPEG, PNG, WebP) nebo PDF. Nejvýše 5 souborů.",
  uploadedFiles: "Nahrané soubory",
  remove: "Odebrat",
  extractContent: "Rozpoznat text",
  extractContentHint: "Obrázky se zmenší a text se rozpozná přímo v prohlížeči (bez cloudů). První spuštění může trvat déle (načtení jazyka).",
  recognizedContent: "Rozpoznaný obsah",
  generateFromContent: "Vygenerovat z nahraného obsahu",

  generate: "Vygenerovat",
  generating: "Generuji…",
  extracting: "Rozpoznávám…",

  placeholderTopic: "např. Karel IV. a středověké Čechy",

  noWorksheet: "Žádný pracovní list není načten.",
  goToHome: "Přejít na úvod",

  parameters: "Parametry",
  actions: "Akce",
  export: "Export",
  print: "Tisk",
  exportPdfStudent: "Export pracovního listu pro žáky PDF (A4)",
  exportPdfTeacher: "Export klíče správných odpovědí pro učitele PDF (A4)",
  printStudent: "Tisk pracovního listu pro žáky",
  printTeacher: "Tisk klíče správných odpovědí pro učitele",
  exportJson: "Export JSON",
  exportQuizJson: "Export Quiz JSON",
  showAnswers: "Zobrazit odpovědi",
  hideAnswers: "Skrýt odpovědi",
  regenerateWhole: "Generovat celý list",
  regenerating: "Generuji…",
  worksheetPreview: "Náhled pracovního listu",

  title: "Název",
  instructionsForStudents: "Instrukce pro žáky",
  answerKey: "Klíč správných odpovědí",
  answer: "Odpověď",
  regenerate: "Generovat",
  delete: "Smazat",
  regenerateWholeWorksheet: "Generovat celý pracovní list",
  addTask: "Přidat vlastní otázku",

  errorEnterTopic: "Zadejte prosím téma.",
  errorGenerationFailed: "Generování se nezdařilo. Zkuste to znovu.",
  errorExtractionFailed: "Rozpoznání textu se nezdařilo. Zkuste to znovu.",
  errorUploadFirst: "Nejprve nahrajte soubory a rozpoznejte text.",
} as const;

/** Typ školy – pro přípravu LLM (LMP = škola pro žáky s lehkým mentálním postižením) */
export const SCHOOL_TYPES: { value: "basic" | "lmp"; label: string }[] = [
  { value: "basic", label: "Základní škola" },
  { value: "lmp", label: "Základní škola pro žáky s lehkým mentálním postižením (LMP)" },
];

/** Předměty – hodnota se ukládá do dat */
export const SUBJECTS: { value: string; label: string }[] = [
  { value: "Dějepis", label: "Dějepis" },
  { value: "Zeměpis", label: "Zeměpis" },
  { value: "Přírodopis", label: "Přírodopis" },
  { value: "Matematika", label: "Matematika" },
  { value: "Čeština", label: "Čeština" },
  { value: "Cizí jazyk", label: "Cizí jazyk" },
  { value: "Jiné", label: "Jiné" },
];

export const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "Čeština", label: "Čeština" },
  { value: "Angličtina", label: "Angličtina" },
  { value: "Němčina", label: "Němčina" },
  { value: "Francouzština", label: "Francouzština" },
  { value: "Španělština", label: "Španělština" },
  { value: "Ukrajinština", label: "Ukrajinština" },
];

export const OUTPUT_TYPES: { value: OutputType; label: string }[] = [
  { value: "worksheet", label: "Pracovní list" },
  { value: "reading_comprehension", label: "Otázky k porozumění textu" },
];

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "fill_in", label: "Doplňování" },
  { value: "multiple_choice", label: "Výběr z možností" },
  { value: "true_false", label: "Pravda / Nepravda" },
  { value: "short_answer", label: "Krátká odpověď" },
  { value: "reading_questions", label: "Otázky k textu" },
  { value: "draw_picture", label: "Nakresli obrázek" },
];

/** Typy úloh pro generování z učebnice (bez „Nakresli obrázek“, ten je jen z tématu). */
export const TASK_TYPES_FOR_TEXTBOOK: { value: TaskType; label: string }[] = TASK_TYPES.filter(
  (t) => t.value !== "draw_picture"
);

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Lehká" },
  { value: "normal", label: "Střední" },
  { value: "hard", label: "Obtížná" },
];

export const USE_CASES: { value: UseCase; label: string }[] = [
  { value: "practice", label: "Procvičování" },
  { value: "revision", label: "Opakování" },
  { value: "homework", label: "Domácí úkol" },
  { value: "pairwork", label: "Práce ve dvojicích" },
];

/** Pro zobrazení uložených hodnot (např. na stránce výsledku) */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Lehká",
  normal: "Střední",
  hard: "Obtížná",
};

export const USE_CASE_LABELS: Record<UseCase, string> = {
  practice: "Procvičování",
  revision: "Opakování",
  test: "Ověření znalostí",
  homework: "Domácí úkol",
  pairwork: "Práce ve dvojicích",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  fill_in: "Doplňování",
  multiple_choice: "Výběr z možností",
  true_false: "Pravda / Nepravda",
  short_answer: "Krátká odpověď",
  reading_questions: "Otázky k textu",
  draw_picture: "Nakresli obrázek",
};

export const SOURCE_TYPE_LABELS: Record<"topic" | "textbook", string> = {
  topic: "Z tématu",
  textbook: "Z učebnice",
};

export const SCHOOL_TYPE_LABELS: Record<"basic" | "svp" | "lmp", string> = {
  basic: "Základní škola",
  svp: "Zjednodušená verze (SVP)",
  lmp: "Základní škola pro žáky s lehkým mentálním postižením (LMP)",
};
