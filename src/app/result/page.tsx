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

export default function ResultPage() {
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getWorksheetFromSession();
    setWorksheet(stored);
  }, []);

  const persist = (next: Worksheet) => {
    setWorksheet(next);
    saveWorksheetToSession(next);
  };

  const handleToggleAnswers = () => {
    if (!worksheet) return;
    persist({ ...worksheet, answersVisible: !worksheet.answersVisible });
  };

  const handleEditTitle = (title: string) => {
    if (!worksheet) return;
    persist({ ...worksheet, title });
  };

  const handleEditInstructions = (instructions: string) => {
    if (!worksheet) return;
    persist({ ...worksheet, instructions });
  };

  const handleEditTask = (
    taskId: string,
    updates: Partial<WorksheetTask>
  ) => {
    if (!worksheet) return;
    const tasks = worksheet.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    persist({ ...worksheet, tasks });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!worksheet) return;
    const tasks = worksheet.tasks.filter((t) => t.id !== taskId);
    persist({ ...worksheet, tasks });
  };

  const handleRegenerateTask = async (taskId: string) => {
    if (!worksheet) return;
    setRegeneratingId(taskId);
    setRegenError(null);
    try {
      const newTask = await regenerateSingleTask(worksheet, taskId);
      const tasks = worksheet.tasks.map((t) =>
        t.id === taskId ? newTask : t
      );
      persist({ ...worksheet, tasks });
    } catch (err) {
      console.error("Regenerate task failed:", err);
      setRegenError("Regenerace této úlohy se nezdařila. Zkuste to prosím znovu.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleAddTask = () => {
    if (!worksheet) return;
    const newTask: WorksheetTask = {
      id: `manual-${Date.now()}`,
      type: "short_answer",
      question: "",
      answer: "",
      options: [],
    };
    const tasks = [...worksheet.tasks, newTask];
    persist({ ...worksheet, tasks });
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
        <div className="text-center">
          <p className="text-slate-600">{TEXTS.noWorksheet}</p>
          <Link href="/" className="mt-4 inline-block text-slate-800 underline">
            {TEXTS.goToHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen print:block">
      {/* Print-only content: outside no-print so it stays visible when printing */}
      {worksheet && <PrintWorksheet worksheet={worksheet} />}

      <div className="no-print max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: params + actions + exports */}
          <aside className="lg:w-64 shrink-0 space-y-6">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {TEXTS.backToHome}
            </Link>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
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
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
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
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {TEXTS.export}
              </h2>
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
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPdf("teacher")}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? "Generuji PDF…" : TEXTS.exportPdfTeacher}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintStudent}>
                  {TEXTS.printStudent}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintTeacher}>
                  {TEXTS.printTeacher}
                </Button>
              </div>
            </div>
          </aside>

          {/* Right: worksheet preview / editor */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <WorksheetPreview
                worksheet={worksheet}
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
