/**
 * Quiz export model for integration with an existing quiz module.
 * Separate from internal worksheet format.
 */
export type QuizQuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  order: number;
}

export interface QuizExport {
  title: string;
  subject: string;
  grade: string;
  questions: QuizQuestion[];
}
