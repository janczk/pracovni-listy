"use client";

import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import { TEXTS, TASK_TYPE_LABELS, TASK_TYPES } from "@/lib/czech";
import { formatOptionWithLabel, getCorrectOptionIndex, formatTrueFalseAnswer } from "@/lib/optionLabels";

interface WorksheetPreviewProps {
  worksheet: Worksheet;
  onToggleAnswers: () => void;
  onEditTitle: (title: string) => void;
  onEditInstructions: (instructions: string) => void;
  onEditTask: (taskId: string, updates: Partial<WorksheetTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onRegenerateTask: (taskId: string) => void;
  onRegenerateAll: () => void;
  onAddTask: () => void;
  regeneratingTaskId?: string | null;
}

export function WorksheetPreview({
  worksheet,
  onToggleAnswers,
  onEditTitle,
  onEditInstructions,
  onEditTask,
  onDeleteTask,
  onRegenerateTask,
  onRegenerateAll,
  onAddTask,
  regeneratingTaskId,
}: WorksheetPreviewProps) {
  return (
    <>
      {/* Screen view: editable + actions */}
      <div className="print:hidden space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {TEXTS.title}
          </label>
          <input
            type="text"
            value={worksheet.title}
            onChange={(e) => onEditTitle(e.target.value)}
            className="w-full text-lg font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {TEXTS.instructionsForStudents}
          </label>
          <textarea
            value={worksheet.instructions}
            onChange={(e) => onEditInstructions(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>
        <p className="text-sm text-slate-600">
          {worksheet.subject}
          {" · "}
          {worksheet.grade}. ročník
          {worksheet.classLabel ? `, ${worksheet.classLabel}` : ""}
        </p>

        <ol className="list-decimal list-inside space-y-4">
          {worksheet.tasks.map((task, i) => (
            <li key={task.id} className="pl-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {task.id.startsWith("manual-") ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                        {TASK_TYPE_LABELS[task.type]}
                      </span>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {TASK_TYPES.map((t) => (
                          <label
                            key={t.value}
                            className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"
                          >
                            <input
                              type="radio"
                              name={`task-type-${task.id}`}
                              value={t.value}
                              checked={task.type === t.value}
                              onChange={() => onEditTask(task.id, { type: t.value })}
                              className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500"
                            />
                            <span>{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  )}
                  <textarea
                    value={task.question}
                    onChange={(e) =>
                      onEditTask(task.id, { question: e.target.value })
                    }
                    rows={2}
                    className="mt-1.5 w-full text-sm"
                  />
                  {task.options && task.options.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 text-slate-700 text-sm">
                      {task.options.map((opt, j) => (
                        <li key={j}>{formatOptionWithLabel(j, opt)}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRegenerateTask(task.id)}
                    disabled={regeneratingTaskId === task.id}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {regeneratingTaskId === task.id ? TEXTS.regenerating : TEXTS.regenerate}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    {TEXTS.delete}
                  </button>
                </div>
              </div>
              {worksheet.answersVisible && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">{TEXTS.answer}: </span>
                  <span className="text-sm text-slate-700">
                    {task.type === "draw_picture"
                      ? "(nákres)"
                      : task.options && task.options.length > 0
                      ? (() => {
                          const idx = getCorrectOptionIndex(task.options, task.answer);
                          if (idx >= 0)
                            return formatOptionWithLabel(idx, task.options[idx]);
                          return Array.isArray(task.answer)
                            ? task.answer.join(", ")
                            : task.answer;
                        })()
                      : task.type === "true_false"
                        ? formatTrueFalseAnswer(
                            Array.isArray(task.answer) ? task.answer[0] : task.answer
                          )
                        : Array.isArray(task.answer)
                          ? task.answer.join(", ")
                          : task.answer}
                  </span>
                  {task.explanation && (
                    <p className="text-xs text-slate-500 mt-1">
                      {task.explanation}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex items-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            {TEXTS.addTask}
          </button>
        </div>

        {worksheet.answersVisible && (
          <div className="rounded-xl border border-slate-200 bg-primary-50/40 p-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {TEXTS.answerKey}
            </h3>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-slate-700">
              {worksheet.tasks.map((task, i) => (
                <li key={task.id}>
                  {task.type === "draw_picture"
                    ? "—"
                    : task.options && task.options.length > 0
                    ? (() => {
                        const idx = getCorrectOptionIndex(task.options, task.answer);
                        if (idx >= 0)
                          return formatOptionWithLabel(idx, task.options[idx]);
                        return Array.isArray(task.answer)
                          ? task.answer.join(", ")
                          : task.answer;
                      })()
                    : task.type === "true_false"
                      ? formatTrueFalseAnswer(
                          Array.isArray(task.answer) ? task.answer[0] : task.answer
                        )
                      : Array.isArray(task.answer)
                        ? task.answer.join(", ")
                        : task.answer}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onToggleAnswers}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {worksheet.answersVisible ? TEXTS.hideAnswers : TEXTS.showAnswers}
          </button>
          <button
            type="button"
            onClick={onRegenerateAll}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {TEXTS.regenerateWholeWorksheet}
          </button>
        </div>
      </div>
    </>
  );
}
