/**
 * Internal worksheet model used across the app.
 * Designed for editing, display, and later conversion to quiz format.
 */
export type TaskType =
  | "fill_in"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "reading_questions";

export type Difficulty = "easy" | "normal" | "hard";

export type UseCase =
  | "practice"
  | "revision"
  | "test"
  | "homework"
  | "pairwork";

export type OutputType = "worksheet" | "short_test" | "reading_comprehension";

export interface WorksheetTask {
  id: string;
  type: TaskType;
  question: string;
  options?: string[];
  answer: string | string[];
  explanation?: string;
}

/** Typ školy – ukládáme pro LLM (SVP = zjednodušená verze) */
export type SchoolType = "basic" | "svp";

export interface Worksheet {
  id: string;
  title: string;
  /** Typ školy, pod kterou byl list vytvořen */
  schoolType?: SchoolType;
  subject: string;
  grade: string;
  /** Název třídy (např. „6.B“); volitelný */
  classLabel?: string;
  language: string;
  sourceType: "topic" | "textbook";
  sourceText?: string;
  instructions: string;
  difficulty: Difficulty;
  useCase: UseCase;
  taskTypes: TaskType[];
  tasks: WorksheetTask[];
  answersVisible: boolean;
  createdAt: string;
}
