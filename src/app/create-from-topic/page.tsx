"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { generateWorksheetFromTopic, simplifyWorksheetForSvp } from "@/services/worksheetGeneration";
import { saveWorksheetToSession } from "@/lib/storage";
import {
  TEXTS,
  SCHOOL_TYPES,
  SUBJECTS,
  GRADES,
  LANGUAGES,
  OUTPUT_TYPES,
  TASK_TYPES,
  DIFFICULTIES,
  USE_CASES,
} from "@/lib/czech";
import type { TopicInput } from "@/types/inputs";
import type { OutputType, TaskType, Difficulty, UseCase } from "@/types/worksheet";

const defaultTaskTypeCounts: TopicInput["taskTypeCounts"] = {
  multiple_choice: 1,
  true_false: 1,
  short_answer: 1,
  fill_in: 0,
  reading_questions: 0,
};

const defaultInput: TopicInput = {
  schoolType: "basic",
  subject: "Dějepis",
  grade: "6",
  classLabel: "",
  language: "Čeština",
  topic: "",
  outputType: "worksheet",
  taskTypeCounts: { ...defaultTaskTypeCounts },
  difficulty: "normal",
  useCase: "revision",
  includeAnswers: true,
  simplifiedVersion: false,
};

export default function CreateFromTopicPage() {
  const router = useRouter();
  const [input, setInput] = useState<TopicInput>(defaultInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTaskTypeCount = (t: TaskType, count: number) => {
    setInput((prev) => ({
      ...prev,
      taskTypeCounts: { ...prev.taskTypeCounts, [t]: Math.max(0, Math.min(10, count)) },
    }));
  };

  const totalTasks = Object.values(input.taskTypeCounts || {}).reduce((a, b) => a + (b || 0), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!input.topic.trim()) {
      setError(TEXTS.errorEnterTopic);
      return;
    }
    if (totalTasks === 0) {
      setError("Vyberte alespoň jeden typ úlohy a zadejte počet otázek (min. 1).");
      return;
    }
    setLoading(true);
    try {
      const worksheet = await generateWorksheetFromTopic({
        ...input,
        simplifiedVersion: false,
      });
      worksheet.answersVisible = input.includeAnswers;
      if (input.simplifiedVersion) {
        const simplifiedWorksheet = await simplifyWorksheetForSvp(worksheet);
        simplifiedWorksheet.answersVisible = input.includeAnswers;
        saveWorksheetToSession(worksheet, simplifiedWorksheet);
      } else {
        saveWorksheetToSession(worksheet);
      }
      router.push("/result");
    } catch {
      setError(TEXTS.errorGenerationFailed);
    } finally {
      setLoading(false);
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
          {TEXTS.createFromTopic}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {TEXTS.createFromTopicTitle}
        </h1>
        <p className="mt-1 text-slate-600">
          {TEXTS.createFromTopicDesc}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label={TEXTS.schoolType} id="schoolType">
            <select
              id="schoolType"
              className="w-full"
              value={input.schoolType}
              onChange={(e) =>
                setInput((p) => ({ ...p, schoolType: e.target.value as TopicInput["schoolType"] }))
              }
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
                value={input.subject}
                onChange={(e) =>
                  setInput((p) => ({ ...p, subject: e.target.value }))
                }
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
                value={input.grade}
                onChange={(e) =>
                  setInput((p) => ({ ...p, grade: e.target.value }))
                }
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
              value={input.classLabel ?? ""}
              onChange={(e) =>
                setInput((p) => ({ ...p, classLabel: e.target.value.trim() || undefined }))
              }
            />
          </FormField>

          <FormField label={TEXTS.language} id="language">
            <select
              id="language"
              className="w-full"
              value={input.language}
              onChange={(e) =>
                setInput((p) => ({ ...p, language: e.target.value }))
              }
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={TEXTS.topic} id="topic">
            <input
              id="topic"
              type="text"
              required
              placeholder={TEXTS.placeholderTopic}
              className="w-full"
              value={input.topic}
              onChange={(e) =>
                setInput((p) => ({ ...p, topic: e.target.value }))
              }
            />
          </FormField>

          <FormField label={TEXTS.outputType} id="outputType">
            <select
              id="outputType"
              className="w-full"
              value={input.outputType}
              onChange={(e) =>
                setInput((p) => ({
                  ...p,
                  outputType: e.target.value as OutputType,
                }))
              }
            >
              {OUTPUT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={TEXTS.taskTypes}
            id="taskTypes"
            hint="U každého typu úlohy zadejte počet otázek (0 = nezařazovat). Celkem se vygeneruje tolik otázek, kolik zadáte."
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
                    value={input.taskTypeCounts?.[t.value] ?? 0}
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
                value={input.difficulty}
                onChange={(e) =>
                  setInput((p) => ({
                    ...p,
                    difficulty: e.target.value as Difficulty,
                  }))
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
              value={input.useCase}
              onChange={(e) =>
                setInput((p) => ({
                  ...p,
                  useCase: e.target.value as UseCase,
                }))
              }
            >
              {USE_CASES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={input.includeAnswers}
                onChange={(e) =>
                  setInput((p) => ({ ...p, includeAnswers: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700">{TEXTS.includeAnswers}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={input.simplifiedVersion}
                onChange={(e) =>
                  setInput((p) => ({
                    ...p,
                    simplifiedVersion: e.target.checked,
                  }))
                }
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
            type="submit"
            size="lg"
            variant="primary"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? TEXTS.generating : TEXTS.generate}
          </Button>
        </form>
        </div>
      </div>
    </main>
  );
}
