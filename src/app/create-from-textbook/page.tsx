"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { extractSourceTextFromFiles } from "@/services/textExtraction";
import { generateWorksheetFromSourceText } from "@/services/worksheetGeneration";
import { saveWorksheetToSession } from "@/lib/storage";
import {
  TEXTS,
  SCHOOL_TYPES,
  SUBJECTS,
  GRADES,
  OUTPUT_TYPES,
  TASK_TYPES,
  DIFFICULTIES,
  USE_CASES,
} from "@/lib/czech";
import type { TextbookInput } from "@/types/inputs";
import type { OutputType, TaskType, Difficulty, UseCase } from "@/types/worksheet";

const ACCEPT = ".pdf,image/jpeg,image/png,image/webp";

const defaultTaskTypeCounts: TextbookInput["taskTypeCounts"] = {
  multiple_choice: 1,
  true_false: 1,
  short_answer: 1,
  fill_in: 0,
  reading_questions: 0,
};

export default function CreateFromTextbookPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outputType, setOutputType] = useState<OutputType>("worksheet");
  const [schoolType, setSchoolType] = useState<TextbookInput["schoolType"]>("basic");
  const [grade, setGrade] = useState("6");
  const [classLabel, setClassLabel] = useState("");
  const [subject, setSubject] = useState("Dějepis");
  const [taskTypeCounts, setTaskTypeCounts] = useState<TextbookInput["taskTypeCounts"]>({
    ...defaultTaskTypeCounts,
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [useCase, setUseCase] = useState<UseCase>("revision");
  const [simplifiedVersion, setSimplifiedVersion] = useState(false);

  const setTaskTypeCount = (t: TaskType, count: number) => {
    setTaskTypeCounts((prev) => ({
      ...prev,
      [t]: Math.max(0, Math.min(10, count)),
    }));
  };

  const totalTasks = Object.values(taskTypeCounts || {}).reduce((a, b) => a + (b || 0), 0);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length === 0) return;
    setFiles((prev) => {
      const combined = [...prev, ...chosen].slice(0, 5);
      return combined;
    });
    setExtractedText(null);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setExtractedText(null);
  };

  const extractText = async () => {
    if (files.length === 0) return;
    setError(null);
    setExtracting(true);
    try {
      const result = await extractSourceTextFromFiles(files);
      setExtractedText(result.text);
    } catch {
      setError(TEXTS.errorExtractionFailed);
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    const text = extractedText?.trim();
    if (!text) {
      setError(TEXTS.errorUploadFirst);
      return;
    }
    if (totalTasks === 0) {
      setError("Zadejte u alespoň jednoho typu úlohy počet otázek (min. 1).");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const input: TextbookInput = {
        extractedText: text,
        outputType,
        schoolType,
        grade,
        classLabel: classLabel.trim() || undefined,
        subject,
        taskTypeCounts,
        difficulty,
        useCase,
        simplifiedVersion,
      };
      const worksheet = await generateWorksheetFromSourceText(input);
      worksheet.answersVisible = true;
      saveWorksheetToSession(worksheet);
      router.push("/result");
    } catch {
      setError(TEXTS.errorGenerationFailed);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-primary-600 no-print transition-colors"
        >
          {TEXTS.backToHome}
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary-600">
          {TEXTS.createFromTextbook}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {TEXTS.createFromTextbookTitle}
        </h1>
        <p className="mt-1 text-slate-600">
          {TEXTS.createFromTextbookDesc}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
        <div className="space-y-6">
          <FormField
            label={TEXTS.uploadFiles}
            id="files"
            hint={TEXTS.uploadFilesHint}
          >
            <input
              ref={fileInputRef}
              id="files"
              type="file"
              accept={ACCEPT}
              multiple
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-50 file:px-4 file:py-2.5 file:font-semibold file:text-primary-700 file:transition-colors hover:file:bg-primary-100"
              onChange={onFileChange}
            />
          </FormField>

          {files.length > 0 && (
            <>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  {TEXTS.uploadedFiles} ({files.length})
                </p>
                <ul className="space-y-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm"
                    >
                      <span className="truncate font-medium text-slate-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-slate-500 hover:text-red-600 font-medium transition-colors"
                      >
                        {TEXTS.remove}
                      </button>
                    </li>
                  ))}
                </ul>
                {TEXTS.extractContentHint && (
                  <p className="mt-1 text-xs text-slate-500">
                    {TEXTS.extractContentHint}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={extractText}
                  disabled={extracting}
                >
                  {extracting ? TEXTS.extracting : TEXTS.extractContent}
                </Button>
              </div>

              {extractedText && (
                <div className="rounded-xl border border-slate-200 bg-primary-50/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {TEXTS.recognizedContent}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap line-clamp-6 max-h-40 overflow-y-auto">
                    {extractedText}
                  </p>
                </div>
              )}
            </>
          )}

          <hr className="border-slate-200" />

          <FormField label={TEXTS.outputType} id="outputType">
            <select
              id="outputType"
              className="w-full"
              value={outputType}
              onChange={(e) =>
                setOutputType(e.target.value as OutputType)
              }
            >
              {OUTPUT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={TEXTS.schoolType} id="schoolType">
            <select
              id="schoolType"
              className="w-full"
              value={schoolType}
              onChange={(e) => setSchoolType(e.target.value as TextbookInput["schoolType"])}
            >
              {SCHOOL_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={TEXTS.subject} id="subject">
              <select
                id="subject"
                className="w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={TEXTS.grade} id="grade">
              <select
                id="grade"
                className="w-full"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label={TEXTS.classLabel} id="classLabel" hint={TEXTS.classLabelPlaceholder}>
            <input
              id="classLabel"
              type="text"
              placeholder="např. 6.B"
              className="w-full"
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
            />
          </FormField>

          <FormField
            label={TEXTS.taskTypes}
            id="taskTypes"
            hint="U každého typu zadejte počet otázek (0 = nezařazovat)."
          >
            <div className="space-y-3">
              {TASK_TYPES.map((t) => (
                <div
                  key={t.value}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className="w-20 text-center"
                    value={taskTypeCounts?.[t.value] ?? 0}
                    onChange={(e) =>
                      setTaskTypeCount(t.value, Number(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500">Celkem otázek: {totalTasks}</p>
            </div>
          </FormField>

          <FormField label={TEXTS.difficulty} id="difficulty">
              <select
                id="difficulty"
                className="w-full"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as Difficulty)
                }
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </FormField>

          <FormField label={TEXTS.intendedUse} id="useCase">
            <select
              id="useCase"
              className="w-full"
              value={useCase}
              onChange={(e) =>
                setUseCase(e.target.value as UseCase)
              }
            >
              {USE_CASES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={simplifiedVersion}
                onChange={(e) => setSimplifiedVersion(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700">
                {TEXTS.simplifiedVersion}
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            variant="primary"
            disabled={!extractedText || generating}
            onClick={handleGenerate}
            className="w-full sm:w-auto"
          >
            {generating ? TEXTS.generating : TEXTS.generateFromContent}
          </Button>
        </div>
        </div>
      </div>
    </main>
  );
}
