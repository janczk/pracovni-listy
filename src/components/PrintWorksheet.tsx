import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import { formatOptionWithLabel, getCorrectOptionIndex } from "@/lib/optionLabels";
import {
  getTaskTypeLabels,
  getWorksheetUiStrings,
  formatSubjectGrade,
  formatTrueFalseForDisplay,
  formatTrueFalseOptionDisplay,
} from "@/lib/worksheetLabelsByLanguage";

const SVP_HEADING = "Zjednodušená verze (pro žáky se speciálními vzdělávacími potřebami)";

function TaskLabel({ type, label }: { type: WorksheetTask["type"]; label: string }) {
  return (
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {label}
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
  const allCaps = Boolean(worksheet.allCapsForSvp);
  const lang = worksheet.language ?? "Čeština";
  const taskLabels = getTaskTypeLabels(lang);
  const ui = getWorksheetUiStrings(lang);
  return (
    <div id={id} className={`hidden p-8 max-w-none print:block ${allCaps ? "worksheet-all-caps" : ""}`} aria-hidden="true">
      {titleAbove && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-0">{titleAbove}</h2>
      )}
      <img src="/logo.png" alt="" className="h-10 w-10 mb-3 object-contain" />
      <h1 className="text-2xl text-slate-900 mb-1 font-normal">
        {worksheet.title}
      </h1>
      <p className="text-sm text-slate-600 mb-2">
        {formatSubjectGrade(lang, worksheet.subject, worksheet.grade, worksheet.classLabel)}
      </p>
      <p className="text-sm text-slate-800 mb-1 font-normal">
        {ui.nameLabel}
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
            <TaskLabel type={task.type} label={taskLabels[task.type]} />
            <p className="mt-1 text-slate-800 font-normal">{task.question}</p>
            {task.options && task.options.length > 0 && (
              <ul className="mt-2 ml-4 space-y-1 text-slate-700 font-normal">
                {task.options.map((opt, j) => (
                  <li key={j}>
                    {formatOptionWithLabel(
                      j,
                      task.type === "true_false" ? formatTrueFalseOptionDisplay(opt, lang) : opt
                    )}
                  </li>
                ))}
              </ul>
            )}
            {task.type === "true_false" && (
              <p className="mt-2 text-sm text-slate-600 font-normal">
                {ui.yes} / {ui.no}
              </p>
            )}
            {task.type === "fill_in" && (
              <div
                className="mt-2 min-h-[5rem] border-b border-slate-300"
                aria-hidden="true"
              />
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
  const allCaps = Boolean(worksheet.allCapsForSvp);
  const lang = worksheet.language ?? "Čeština";
  const ui = getWorksheetUiStrings(lang);
  return (
    <div id={id} className={`hidden p-8 max-w-none print:block ${allCaps ? "worksheet-all-caps" : ""}`} aria-hidden="true">
      {titleAbove && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-0">{titleAbove}</h2>
      )}
      <img src="/logo.png" alt="" className="h-10 w-10 mb-3 object-contain" />
      <h1 className="text-xl text-slate-900 mb-2 font-normal">
        {ui.answerKeyTitle}
      </h1>
      <p className="text-sm text-slate-600 mb-4 font-normal">
        {worksheet.title}
        {" · "}
        {formatSubjectGrade(lang, worksheet.subject, worksheet.grade, worksheet.classLabel)}
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
                ? formatTrueFalseForDisplay(
                    Array.isArray(task.answer) ? task.answer[0] : task.answer,
                    lang
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
 * Číslo stránky (X / Y) na každé vytištěné stránce zobrazuje globální patička přes CSS (print-page-footer).
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

      <div className="print-page-footer" aria-hidden="true" />
    </>
  );
}
