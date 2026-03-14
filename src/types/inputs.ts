import type { TaskType, Difficulty, UseCase, OutputType } from "./worksheet";

/** Počet otázek pro každý typ úlohy (0 = typ není vybrán) */
export type TaskTypeCounts = Partial<Record<TaskType, number>>;

/** Typ školy – pro budoucí LLM (SVP = zjednodušený výklad, jednodušší látka) */
export type SchoolType = "basic" | "lmp";

export interface TopicInput {
  /** Typ školy: základní nebo pro žáky s SVP */
  schoolType: SchoolType;
  subject: string;
  grade: string;
  /** Název třídy (např. 6.B) */
  classLabel?: string;
  language: string;
  topic: string;
  outputType: OutputType;
  /** Počet otázek pro každý typ úlohy */
  taskTypeCounts: TaskTypeCounts;
  difficulty: Difficulty;
  useCase: UseCase;
  includeAnswers: boolean;
  simplifiedVersion: boolean;
  /** Verze velkým písmenem (pro žáky s SVP). */
  allCapsForSvp?: boolean;
}

export interface TextbookInput {
  extractedText: string;
  outputType: OutputType;
  /** Typ školy: základní nebo pro žáky s SVP */
  schoolType: SchoolType;
  grade: string;
  /** Název třídy (např. 6.B) */
  classLabel?: string;
  subject: string;
  /** Jazyk celého výstupu pracovního listu */
  language: string;
  /** Počet otázek pro každý typ úlohy */
  taskTypeCounts: TaskTypeCounts;
  difficulty: Difficulty;
  useCase: UseCase;
  simplifiedVersion: boolean;
  /** Verze velkým písmenem (pro žáky s SVP). */
  allCapsForSvp?: boolean;
}
