import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGeminiModel } from "@/services/geminiClient";
import { recordGeneration } from "@/lib/analyticsServer";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { SVP_GENERATION_CONFIG } from "@/lib/geminiWorksheetConfig";

interface RequestBody {
  worksheet: Worksheet;
}

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

/**
 * Přijme běžný pracovní list a vrátí verzi se stejnými otázkami a odpověďmi,
 * ale s textem zjednodušeným pro žáky se SVP (porozumění psanému textu).
 */
export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo požadavku." }, { status: 400 });
  }

  const { worksheet } = body;
  if (!worksheet?.tasks?.length) {
    return NextResponse.json({ error: "Chybí worksheet nebo úlohy." }, { status: 400 });
  }

  try {
    let model;
    try {
      model = getGeminiModel();
    } catch (geminiErr) {
      console.error("worksheet-simplify-for-svp: Gemini není nakonfigurován", geminiErr);
      return NextResponse.json(
        { error: "Generování vyžaduje API klíč (GEMINI_API_KEY). Přidejte ho do .env.local a restartujte server." },
        { status: 503 }
      );
    }

    const hasEmptyAnswer = worksheet.tasks.some(
      (t) => t.answer === "" || t.answer === undefined || (Array.isArray(t.answer) && t.answer.length === 0)
    );

    const lang = worksheet.language ?? "Čeština";
    const tasksDescription = worksheet.tasks
      .map(
        (t, i) =>
          `${i + 1}. [${t.type}] "${(t.question || "").trim()}"${t.options?.length ? ` možnosti=${JSON.stringify(t.options)}` : ""} odpověď=${JSON.stringify(t.answer ?? "")}`
      )
      .join("\n");

    const userPrompt = [
      "Úkol: Zjednoduš jazyk úloh pro žáky se SVP (slabší porozumění psanému textu). Učivo a náročnost zůstávají jako na běžné ZŠ.",
      "Pravidla – neměň:\n- význam otázky (stejná otázka, jen srozumitelnější formulace)\n- správnou odpověď (u výběru z možností stejný text správné odpovědi, stejné pořadí možností)\n- typ úlohy",
      "Jak zjednodušovat:\n- krátké věty, běžná slova\n- vyhni se složitým souvětím; jedna věta = jedna informace\n- u otázek používej kratší formulace (řádově do cca 12–15 slov)",
      `Jazyk: ${lang}. Vrať stejný počet úloh ve stejném pořadí.`,
      hasEmptyAnswer ? "U úloh s prázdnou odpovědí (kromě draw_picture) doplň krátkou správnou odpověď." : "",
      "Úlohy:",
      tasksDescription,
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: SVP_GENERATION_CONFIG,
    });

    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    const rawText = result.response.text();
    if (!rawText || !rawText.trim()) {
      throw new Error("Model nevrátil žádný text.");
    }

    let parsed: GeminiResponse;
    try {
      parsed = parseTasksJson(rawText);
    } catch {
      throw new Error("Model nevrátil neplatný JSON.");
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error("Model nevrátil prázdný seznam úloh.");
    }

    const simplifiedTasks: WorksheetTask[] = worksheet.tasks.map((original, index) => {
      const s = parsed.tasks[index];
      return {
        id: original.id,
        type: original.type,
        question: (s?.question != null && String(s.question).trim() !== "" ? s.question : original.question) as string,
        options: original.type === "draw_picture" ? [] : (s?.options ?? original.options),
        answer: original.type === "draw_picture" ? "" : (s?.answer !== undefined && s?.answer !== "" ? s.answer : original.answer),
        explanation: s?.explanation ?? original.explanation,
      };
    });

    const simplifiedWorksheet: Worksheet = {
      ...worksheet,
      id: `${worksheet.id}-svp`,
      title: `${worksheet.title} (zjednodušená verze pro SVP)`,
      schoolType: "svp",
      instructions: "Vyplň pracovní list podle zadání. (Zjednodušená verze pro snazší čtení.)",
      taskTypes: worksheet.taskTypes,
      tasks: simplifiedTasks,
    };

    const cookieStore = await cookies();
    const betaUserId = cookieStore.get("beta_access")?.value;
    await recordGeneration({ inputTokens, outputTokens }, betaUserId);

    return NextResponse.json(simplifiedWorksheet);
  } catch (error) {
    console.error("worksheet-simplify-for-svp failed:", error);
    const message =
      error instanceof Error ? error.message : "Zjednodušení pro SVP se nezdařilo.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
