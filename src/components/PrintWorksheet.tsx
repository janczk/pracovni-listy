import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import { TASK_TYPE_LABELS } from "@/lib/czech";
import { formatOptionWithLabel, getCorrectOptionIndex, formatTrueFalseAnswer } from "@/lib/optionLabels";

function TaskLabel({ type }: { type: WorksheetTask["type"] }) {
  return (
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {TASK_TYPE_LABELS[type]}
    </span>
  );
}

/**
 * Tisk – dva oddělené bloky: pro žáky (bez klíče) a pro učitele (pouze klíč).
 * Bez tučného písma. Zobrazení řídí CSS (print-student / print-teacher).
 */
export function PrintWorksheet({ worksheet }: { worksheet: Worksheet }) {
  return (
    <>
      <div
        id="print-area-student"
        className="hidden p-8 max-w-none"
        aria-hidden="true"
      >
        <h1 className="text-2xl text-slate-900 mb-1 font-normal">
          {worksheet.title}
        </h1>
        <p className="text-sm text-slate-600 mb-2">
          {worksheet.subject}
          {" · "}
          {worksheet.grade}. ročník
          {worksheet.classLabel ? `, ${worksheet.classLabel}` : ""}
        </p>
        <p className="text-sm text-slate-800 mb-1 font-normal">
          Jméno a příjmení:
        </p>
        <div
          className="min-h-[2.75rem] border-b border-slate-300 mb-6"
          aria-hidden="true"
        />
        <p className="text-slate-700 whitespace-pre-wrap mb-6 font-normal">
          {worksheet.instructions}
        </p>
        <ol className="list-decimal list-inside space-y-4">
          {worksheet.tasks.map((task) => (
            <li key={task.id} className="pl-2">
              <TaskLabel type={task.type} />
              <p className="mt-1 text-slate-800 font-normal">{task.question}</p>
              {task.options && task.options.length > 0 && (
                <ul className="mt-2 ml-4 space-y-1 text-slate-700 font-normal">
                  {task.options.map((opt, j) => (
                    <li key={j}>{formatOptionWithLabel(j, opt)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div
        id="print-area-teacher"
        className="hidden p-8 max-w-none"
        aria-hidden="true"
      >
        <h1 className="text-xl text-slate-900 mb-2 font-normal">
          Klíč správných odpovědí
        </h1>
        <p className="text-sm text-slate-600 mb-4 font-normal">
          {worksheet.title}
          {" · "}
          {worksheet.subject}
          {" · "}
          {worksheet.grade}. ročník
          {worksheet.classLabel ? `, ${worksheet.classLabel}` : ""}
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-700 font-normal">
          {worksheet.tasks.map((task) => (
            <li key={task.id}>
              {task.options && task.options.length > 0
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
    </>
  );
}
