"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { WorksheetPreview } from "@/components/WorksheetPreview";
import { PrintWorksheet } from "@/components/PrintWorksheet";
import { getWorksheetFromSession, saveWorksheetToSession } from "@/lib/storage";
import { exportWorksheetPdf, triggerPrint } from "@/lib/exportUtils";
import {
  TEXTS,
  DIFFICULTY_LABELS,
  USE_CASE_LABELS,
  SOURCE_TYPE_LABELS,
  SCHOOL_TYPE_LABELS,
} from "@/lib/czech";
import { regenerateSingleTask, generateWorksheetFromTopic } from "@/services/worksheetGeneration";
import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import type { TopicInput } from "@/types/inputs";

type PreviewVariant = "normal" | "simplified";

export default function ResultPage() {
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [simplifiedWorksheet, setSimplifiedWorksheet] = useState<Worksheet | null>(null);
  const [previewVariant, setPreviewVariant] = useState<PreviewVariant>("normal");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    const { worksheet: w, simplifiedWorksheet: sw } = getWorksheetFromSession();
    setWorksheet(w);
    setSimplifiedWorksheet(sw);
  }, []);

  const displayedWorksheet: Worksheet =
    previewVariant === "simplified" && simplifiedWorksheet ? simplifiedWorksheet : worksheet!;

  const persist = (next: Worksheet) => {
    if (!worksheet) return;
    if (previewVariant === "simplified" && simplifiedWorksheet) {
      setSimplifiedWorksheet(next);
      saveWorksheetToSession(worksheet, next);
    } else {
      setWorksheet(next);
      saveWorksheetToSession(next, simplifiedWorksheet);
    }
  };

  const handleToggleAnswers = () => {
    if (!displayedWorksheet) return;
    persist({ ...displayedWorksheet, answersVisible: !displayedWorksheet.answersVisible });
  };

  const handleEditTitle = (title: string) => {
    if (!displayedWorksheet) return;
    persist({ ...displayedWorksheet, title });
  };

  const handleEditInstructions = (instructions: string) => {
    if (!displayedWorksheet) return;
    persist({ ...displayedWorksheet, instructions });
  };

  const handleEditTask = (
    taskId: string,
    updates: Partial<WorksheetTask>
  ) => {
    if (!displayedWorksheet) return;
    const tasks = displayedWorksheet.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    persist({ ...displayedWorksheet, tasks });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!displayedWorksheet) return;
    const tasks = displayedWorksheet.tasks.filter((t) => t.id !== taskId);
    persist({ ...displayedWorksheet, tasks });
  };

  const handleRegenerateTask = async (taskId: string) => {
    if (!displayedWorksheet) return;
    setRegeneratingId(taskId);
    setRegenError(null);
    try {
      const newTask = await regenerateSingleTask(displayedWorksheet, taskId);
      const tasks = displayedWorksheet.tasks.map((t) =>
        t.id === taskId ? newTask : t
      );
      persist({ ...displayedWorksheet, tasks });
    } catch (err) {
      console.error("Regenerate task failed:", err);
      setRegenError("Regenerace této úlohy se nezdařila. Zkuste to prosím znovu.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleAddTask = () => {
    if (!displayedWorksheet) return;
    const newTask: WorksheetTask = {
      id: `manual-${Date.now()}`,
      type: "short_answer",
      question: "",
      answer: "",
      options: [],
    };
    const tasks = [...displayedWorksheet.tasks, newTask];
    persist({ ...displayedWorksheet, tasks });
  };

  const handleRegenerateAll = async () => {
    if (!worksheet) return;
    setRegeneratingAll(true);
    try {
      const taskTypeCounts = worksheet.taskTypes.reduce(
        (acc, type) => {
          const count = worksheet.tasks.filter((t) => t.type === type).length;
          if (count > 0) acc[type] = count;
          return acc;
        },
        {} as TopicInput["taskTypeCounts"]
      );
      const input: TopicInput = {
        schoolType: worksheet.schoolType ?? "basic",
        subject: worksheet.subject,
        grade: worksheet.grade,
        classLabel: worksheet.classLabel,
        language: worksheet.language,
        topic: worksheet.title.replace(/^Pracovní list:\s*/i, "").replace(/^Worksheet:\s*/i, ""),
        outputType: "worksheet",
        taskTypeCounts: Object.keys(taskTypeCounts).length ? taskTypeCounts : { short_answer: 1 },
        difficulty: worksheet.difficulty,
        useCase: worksheet.useCase,
        includeAnswers: worksheet.answersVisible,
        simplifiedVersion: false,
      };
      const next = await generateWorksheetFromTopic(input);
      next.answersVisible = worksheet.answersVisible;
      next.classLabel = worksheet.classLabel;
      next.schoolType = worksheet.schoolType;
      persist(next);
    } finally {
      setRegeneratingAll(false);
    }
  };

  const handlePrintStudent = () => {
    triggerPrint("student");
  };

  const handlePrintTeacher = () => {
    triggerPrint("teacher");
  };

  const handleExportPdf = async (variant: "student" | "teacher") => {
    if (!worksheet) return;
    setPdfError(null);
    setExportingPdf(true);
    try {
      await exportWorksheetPdf(worksheet, variant);
      if (simplifiedWorksheet) {
        // Krátké zpoždění, aby prohlížeč nezablokoval druhé stažení
        await new Promise((r) => setTimeout(r, 400));
        await exportWorksheetPdf(simplifiedWorksheet, variant, "zjednodusena");
      }
    } catch (err) {
      console.error("Export PDF failed:", err);
      setPdfError(
        "Export PDF se nezdařil. Otevřete konzoli prohlížeče (F12) pro podrobnosti."
      );
    } finally {
      setExportingPdf(false);
    }
  };

  if (!worksheet) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card">
          <p className="text-slate-600">{TEXTS.noWorksheet}</p>
          <Link href="/" className="mt-4 inline-block font-semibold text-primary-600 hover:text-primary-700">
            {TEXTS.goToHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen print:block">
      {/* Print-only content: outside no-print so it stays visible when printing */}
      {worksheet && (
        <PrintWorksheet
          worksheet={worksheet}
          simplifiedWorksheet={simplifiedWorksheet}
        />
      )}

      <div className="no-print max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: params + actions + exports */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
            >
              {TEXTS.backToHome}
            </Link>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                {TEXTS.parameters}
              </h2>
              <ul className="mt-2 text-sm text-slate-600 space-y-1">
                {worksheet.schoolType != null && (
                  <li>Typ školy: {SCHOOL_TYPE_LABELS[worksheet.schoolType]}</li>
                )}
                <li>
                  {worksheet.subject} · {worksheet.grade}. ročník
                  {worksheet.classLabel ? `, ${worksheet.classLabel}` : ""}
                </li>
                <li>Obtížnost: {DIFFICULTY_LABELS[worksheet.difficulty]}</li>
                <li>Účel: {USE_CASE_LABELS[worksheet.useCase]}</li>
                <li>Zdroj: {SOURCE_TYPE_LABELS[worksheet.sourceType]}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                {TEXTS.actions}
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAnswers}
                >
                  {worksheet.answersVisible ? TEXTS.hideAnswers : TEXTS.showAnswers}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateAll}
                  disabled={regeneratingAll}
                >
                  {regeneratingAll ? TEXTS.regenerating : TEXTS.regenerateWhole}
                </Button>
              </div>
            </div>
            {regenError && (
              <p className="text-sm text-red-600" role="alert">
                {regenError}
              </p>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                {TEXTS.export}
              </h2>
              {simplifiedWorksheet && (
                <p className="mt-1 text-xs text-slate-600">
                  K dispozici jsou obě verze: běžná a zjednodušená (SVP). Export i tisk vyhotoví obě sady.
                </p>
              )}
              {pdfError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {pdfError}
                </p>
              )}
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExportPdf("student")}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? "Generuji PDF…" : TEXTS.exportPdfStudent}
                  {simplifiedWorksheet && " (2 soubory)"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPdf("teacher")}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? "Generuji PDF…" : TEXTS.exportPdfTeacher}
                  {simplifiedWorksheet && " (2 soubory)"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintStudent}>
                  {TEXTS.printStudent}
                  {simplifiedWorksheet && " (obě verze)"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintTeacher}>
                  {TEXTS.printTeacher}
                  {simplifiedWorksheet && " (obě verze)"}
                </Button>
              </div>
            </div>
          </aside>

          {/* Right: worksheet preview / editor */}
          <div className="flex-1 min-w-0">
            {simplifiedWorksheet && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewVariant("normal")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    previewVariant === "normal"
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Běžná verze
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVariant("simplified")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    previewVariant === "simplified"
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Zjednodušená verze (SVP)
                </button>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
              <WorksheetPreview
                worksheet={displayedWorksheet}
                onToggleAnswers={handleToggleAnswers}
                onEditTitle={handleEditTitle}
                onEditInstructions={handleEditInstructions}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onRegenerateTask={handleRegenerateTask}
                onRegenerateAll={handleRegenerateAll}
                onAddTask={handleAddTask}
                regeneratingTaskId={regeneratingId}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
