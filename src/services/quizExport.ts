/**
 * Converts internal worksheet to quiz-ready JSON for integration.
 */

import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import type { QuizExport, QuizQuestion, QuizQuestionType } from "@/types/quiz";

const TASK_TO_QUIZ_TYPE: Record<
  WorksheetTask["type"],
  QuizQuestionType | null
> = {
  multiple_choice: "multiple_choice",
  true_false: "true_false",
  short_answer: "short_answer",
  fill_in: "short_answer",
  reading_questions: "short_answer",
  draw_picture: null,
};

/**
 * Export worksheet as quiz JSON (questions, options, correct answers, order).
 */
export function worksheetToQuizExport(worksheet: Worksheet): QuizExport {
  const questions = worksheet.tasks.flatMap((task, index): QuizQuestion[] => {
    const quizType = TASK_TO_QUIZ_TYPE[task.type];
    if (!quizType) return [];
    const correctAnswer = Array.isArray(task.answer)
      ? task.answer
      : task.answer;
    return [
      {
        id: task.id,
        type: quizType,
        prompt: task.question,
        options: task.options,
        correctAnswer,
        order: index + 1,
      },
    ];
  });

  return {
    title: worksheet.title,
    subject: worksheet.subject,
    grade: worksheet.grade,
    questions,
  };
}
