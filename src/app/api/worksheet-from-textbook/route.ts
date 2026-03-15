import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getGeminiModel } from "@/services/geminiClient";
import type { TextbookInput } from "@/types/inputs";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { recordGeneration } from "@/lib/analyticsServer";
import { randomizeTaskOrder } from "@/lib/taskOrder";
import { buildTextbookTitle, getWorksheetLocale } from "@/lib/worksheetLocale";
import {
  WORKSHEET_GENERATION_CONFIG,
  getTaskTypeLinesForPrompt,
  getTaskTypeLinesForLmp,
  LMP_SYSTEM_APPENDIX,
} from "@/lib/geminiWorksheetConfig";

type RequestBody = TextbookInput;

interface GeminiTask {
  type: TaskType;
  question: string;
  options?: string[];
  answer?: string | string[];
  explanation?: string;
}

interface GeminiResponse {
  tasks: GeminiTask[];
}

function parseTasksJson(rawText: string): GeminiResponse {
  const trimmed = rawText.trim();
  let jsonStr = trimmed;
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const withoutFence = lines.slice(1);
    if (withoutFence.length && withoutFence[withoutFence.length - 1].trim().startsWith("```")) {
      withoutFence.pop();
    }
    jsonStr = withoutFence.join("\n").trim();
  }
  return JSON.parse(jsonStr) as GeminiResponse;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo požadavku." }, { status: 400 });
  }

  try {
    let model;
    try {
      model = getGeminiModel();
    } catch (geminiErr) {
      console.error("worksheet-from-textbook: Gemini není nakonfigurován", geminiErr);
      return NextResponse.json(
        { error: "Generování vyžaduje API klíč (GEMINI_API_KEY). Přidejte ho do .env.local a restartujte server." },
        { status: 503 }
      );
    }
    const lang = body.language ?? "Čeština";

    const totalRequested =
      (body.taskTypeCounts.multiple_choice ?? 0) +
      (body.taskTypeCounts.true_false ?? 0) +
      (body.taskTypeCounts.fill_in ?? 0) +
      (body.taskTypeCounts.short_answer ?? 0) +
      (body.taskTypeCounts.reading_questions ?? 0);

    const isLmp = body.schoolType === "lmp";
    const audienceInstruction = isLmp
      ? "Výstup pro žáky s LMP (RVP ZV–LMP)."
      : "Tento výstup je pro BĚŽNOU ZÁKLADNÍ ŠKOLU. Standardní úroveň žáků.";

    const systemInstruction = [
      "Jsi učitel na základní škole. Z textu učebnice vytváříš pracovní list – úlohy vycházejí výhradně z přiloženého textu.",
      `Jazyk: VEŠKERÝ obsah musí být výhradně ve zvoleném jazyce. Žádná angličtina ani míchání jazyků (včetně pravda/nepravda).`,
      "Žádný úvodní text, pouze seznam úloh.",
      ...(isLmp
        ? [LMP_SYSTEM_APPENDIX, ...getTaskTypeLinesForLmp(body.taskTypeCounts as Record<string, number>)]
        : getTaskTypeLinesForPrompt(body.taskTypeCounts as Record<string, number>)),
    ].join("\n");

    const userPrompt = [
      "TEXT Z UČEBNICE:",
      body.extractedText.slice(0, 6000),
      "",
      `Předmět: ${body.subject}, ročník: ${body.grade}. Účel: ${body.useCase}. Obtížnost: ${body.difficulty}.`,
      `Jazyk výstupu: ${lang}.`,
      audienceInstruction,
      "",
      "Počty úloh (drž se přesně):",
      JSON.stringify(body.taskTypeCounts),
      "",
      `Vrať přesně ${totalRequested} úloh v poli tasks.`,
    ].join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      generationConfig: WORKSHEET_GENERATION_CONFIG,
    });

    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    const rawText = result.response.text();
    const parsed = parseTasksJson(rawText);

    const tasks: WorksheetTask[] = (parsed.tasks ?? []).map((t) => ({
      id: uuidv4(),
      type: t.type,
      question: t.question ?? "",
      options: t.options,
      answer: t.answer ?? "",
      explanation: t.explanation,
    }));

    if (!tasks.length) {
      throw new Error("Model nevrátil žádné úlohy.");
    }

    const orderedTasks = randomizeTaskOrder(tasks);
    const usedTypes = Array.from(new Set(orderedTasks.map((t) => t.type))) as TaskType[];

    const locale = getWorksheetLocale(lang);
    const worksheet: Worksheet = {
      id: `ws-${Date.now()}`,
      title: buildTextbookTitle(lang, body.subject),
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      language: lang,
      sourceType: "textbook",
      sourceText: body.extractedText,
      instructions: locale.instructionsTextbook,
      difficulty: body.difficulty,
      useCase: body.useCase,
      taskTypes: usedTypes,
      tasks: orderedTasks,
      answersVisible: true,
      createdAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    const betaUserId = cookieStore.get("beta_access")?.value;
    await recordGeneration(
      {
        generated: 1,
        basicAndLmp: body.schoolType === "lmp" ? 1 : 0,
        inputTokens,
        outputTokens,
      },
      betaUserId
    );

    return NextResponse.json(worksheet);
  } catch (error) {
    console.error("worksheet-from-textbook failed:", error);
    const message =
      error instanceof Error ? error.message : "Generování pracovního listu selhalo.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

