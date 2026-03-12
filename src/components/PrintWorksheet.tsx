import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import { TASK_TYPE_LABELS } from "@/lib/czech";
import { formatOptionWithLabel, getCorrectOptionIndex, formatTrueFalseAnswer } from "@/lib/optionLabels";

const SVP_HEADING = "Zjednodušená verze (pro žáky se speciálními vzdělávacími potřebami)";

function TaskLabel({ type }: { type: WorksheetTask["type"] }) {
  return (
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {TASK_TYPE_LABELS[type]}
    </span>
  );
}

function StudentBlock({
  worksheet,
  id,
  titleAbove,
}: {
  worksheet: Worksheet;
  id: string;
  titleAbove?: string;
}) {
  return (
    <div id={id} className="hidden p-8 max-w-none print:block" aria-hidden="true">
      {titleAbove && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-0">{titleAbove}</h2>
      )}
      <img src="/logo.png" alt="" className="h-10 w-10 mb-3 object-contain" />
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
            {task.type === "draw_picture" && (
              <div
                className="mt-3 min-h-[12rem] border border-dashed border-slate-300 rounded-lg"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TeacherBlock({
  worksheet,
  id,
  titleAbove,
}: {
  worksheet: Worksheet;
  id: string;
  titleAbove?: string;
}) {
  return (
    <div id={id} className="hidden p-8 max-w-none print:block" aria-hidden="true">
      {titleAbove && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-0">{titleAbove}</h2>
      )}
      <img src="/logo.png" alt="" className="h-10 w-10 mb-3 object-contain" />
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
  );
}

/**
 * Tisk – bloky pro žáky a pro učitele. Při předání simplifiedWorksheet se tisknou dvě sady (běžná + zjednodušená).
 * Zobrazení řídí CSS (print-student / print-teacher).
 */
export function PrintWorksheet({
  worksheet,
  simplifiedWorksheet = null,
}: {
  worksheet: Worksheet;
  simplifiedWorksheet?: Worksheet | null;
}) {
  return (
    <>
      <StudentBlock worksheet={worksheet} id="print-area-student" />
      {simplifiedWorksheet && (
        <StudentBlock
          worksheet={simplifiedWorksheet}
          id="print-area-student-simplified"
          titleAbove={SVP_HEADING}
        />
      )}

      <TeacherBlock worksheet={worksheet} id="print-area-teacher" />
      {simplifiedWorksheet && (
        <TeacherBlock
          worksheet={simplifiedWorksheet}
          id="print-area-teacher-simplified"
          titleAbove={SVP_HEADING}
        />
      )}
    </>
  );
}
