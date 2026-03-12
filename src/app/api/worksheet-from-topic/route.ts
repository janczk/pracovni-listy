import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getGeminiModel } from "@/services/geminiClient";
import type { TopicInput } from "@/types/inputs";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { createMockWorksheet } from "@/lib/mockData";

type RequestBody = TopicInput;

interface GeminiTask {
  type: TaskType;
  question: string;
  options?: string[];
  answer: string | string[];
  explanation?: string;
}

interface GeminiResponse {
  tasks: GeminiTask[];
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    // Remove first line (``` or ```json) and any closing ``` at the end
    const withoutFence = lines.slice(1);
    if (withoutFence.length && withoutFence[withoutFence.length - 1].trim().startsWith("```")) {
      withoutFence.pop();
    }
    return withoutFence.join("\n").trim();
  }
  return trimmed;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo požadavku." }, { status: 400 });
  }

  try {
    const model = getGeminiModel();

    const totalRequested =
      (body.taskTypeCounts.multiple_choice ?? 0) +
      (body.taskTypeCounts.true_false ?? 0) +
      (body.taskTypeCounts.fill_in ?? 0) +
      (body.taskTypeCounts.short_answer ?? 0) +
      (body.taskTypeCounts.reading_questions ?? 0);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Jsi učitel na české základní škole.",
                `Vytvoř pracovní list k tématu: "${body.topic}".`,
                `Předmět: ${body.subject}, ročník: ${body.grade}.`,
                `Typ školy: ${body.schoolType === "svp" ? "žáci se speciálními vzdělávacími potřebami (SVP)" : "běžná základní škola"}.`,
                `Jazyk: ${body.language}.`,
                `Účel: ${body.useCase}. Obtížnost: ${body.difficulty}.`,
                "",
                "Všechny otázky musí být výhradně k tomuto tématu.",
                "Pokud je téma osoba (např. Václav Klaus), všechny otázky se musí týkat pouze této osoby, ne jiných osob (např. Karel IV.).",
                "Vytvoř pouze seznam úloh (questions) bez úvodního textu.",
                "Drž se počtů typů úloh (taskTypeCounts):",
                JSON.stringify(body.taskTypeCounts),
                "Typy úloh:",
                "- multiple_choice: výběr z možností A-D, přesně 3–4 možnosti.",
                "- true_false: tvrzení s odpovědí \"true\" nebo \"false\".",
                "- fill_in: doplňovačka s jedním krátkým slovem nebo rokem.",
                "- short_answer: krátká otevřená odpověď (1–2 věty).",
                "- reading_questions: otázky k textu bez nutnosti dalšího textu.",
                "",
                "Odpověz jako validní JSON ve tvaru:",
                '{ "tasks": [ { "type": "...", "question": "...", "options": ["A", "B"], "answer": "...", "explanation": "..." } ] }',
                "Použij pouze ty typy úloh, které mají v taskTypeCounts počet větší než 0.",
                `Celkový počet úloh by měl být přibližně ${totalRequested}, nejvýše o 2 více.`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const rawText = result.response.text();
    const jsonText = extractJsonFromText(rawText);
    const parsed = JSON.parse(jsonText) as GeminiResponse;

    const tasks: WorksheetTask[] = (parsed.tasks ?? []).map((t, index) => ({
      id: uuidv4(),
      type: t.type,
      question: t.question,
      options: t.options,
      answer: t.answer,
      explanation: t.explanation,
    }));

    if (!tasks.length) {
      throw new Error("Model nevrátil žádné úlohy.");
    }

    const usedTypes = Array.from(new Set(tasks.map((t) => t.type))) as TaskType[];

    const worksheet: Worksheet = {
      id: `ws-${Date.now()}`,
      title: `Pracovní list: ${body.topic}`,
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      language: body.language,
      sourceType: "topic",
      sourceText: undefined,
      instructions: "Vyplň pracovní list podle zadání.",
      difficulty: body.difficulty,
      useCase: body.useCase,
      taskTypes: usedTypes,
      tasks,
      answersVisible: body.includeAnswers,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(worksheet);
  } catch (error) {
    console.error("Gemini worksheet-from-topic failed, using mock:", error);
    const mock = createMockWorksheet({
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      language: body.language,
      useCase: body.useCase,
      difficulty: body.difficulty,
    });
    return NextResponse.json(mock, { status: 200 });
  }
}

