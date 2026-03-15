import { NextResponse } from "next/server";
import { getGeminiModel } from "@/services/geminiClient";
import type { WorksheetTask, TaskType } from "@/types/worksheet";
import { REGENERATE_GENERATION_CONFIG } from "@/lib/geminiWorksheetConfig";

interface RequestBody {
  task: WorksheetTask;
}

interface GeminiTask {
  type: TaskType;
  question: string;
  options?: string[];
  answer: string | string[];
  explanation?: string;
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const withoutFence = lines.slice(1);
    if (withoutFence.length && withoutFence[withoutFence.length - 1].trim().startsWith("```")) {
      withoutFence.pop();
    }
    return withoutFence.join("\n").trim();
  }
  return trimmed;
}

/**
 * Zjednoduší jednu úlohu pro SVP: stejný typ a správná odpověď, zjednodušený jazyk.
 */
export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo požadavku." }, { status: 400 });
  }

  const { task } = body;
  if (!task?.id || task?.question == null) {
    return NextResponse.json({ error: "Chybí úloha (task) nebo její pole." }, { status: 400 });
  }

  try {
    const model = getGeminiModel();

    const hasEmptyAnswer =
      task.answer === "" ||
      task.answer === undefined ||
      (Array.isArray(task.answer) && task.answer.length === 0);

    const taskDesc = `Typ: ${task.type}, otázka="${(task.question || "").trim()}"${task.options?.length ? `, možnosti=${JSON.stringify(task.options)}` : ""}, správná odpověď=${JSON.stringify(task.answer ?? "")}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Máš jednu úlohu z pracovního listu pro běžnou ZŠ. Vytvoř její verzi pro žáky se SVP (slabší porozumění psanému textu). Učivo a náročnost zůstávají stejné – mění se jen formulace (zjednodušený jazyk).",
                "",
                "Pravidla – neměň: význam otázky, správnou odpověď (u výběru stejný text i pořadí možností), typ úlohy. Jak zjednodušovat: krátké věty, běžná slova; vyhni se složitým souvětím; jedna věta = jedna informace; u otázky kratší formulace (řádově do cca 12–15 slov).",
                "",
                "Jazyk výstupu: Veškerý text ve stejném jazyce jako původní úloha. U pravda/nepravda piš odpověď v tomto jazyce (např. Pravda/Nepravda), nikdy anglické true/false.",
                "",
                "1) U výběru z možností: stejný počet, pořadí a správná odpověď.",
                "2) U pravda/nepravda: stejný smysl a stejná odpověď ve stejném jazyce.",
                hasEmptyAnswer && task.type !== "draw_picture"
                  ? "3) Správná odpověď je prázdná – zjednoduš otázku a doplň krátkou správnou odpověď v jednoduchém jazyce."
                  : "3) Zachovej typ úlohy.",
                task.type === "draw_picture"
                  ? "4) U draw_picture zjednoduš pouze znění otázky, pole answer nech prázdné."
                  : "",
                "",
                "Úloha:",
                taskDesc,
                "",
                'Odpověz pouze validním JSON ve tvaru: { "type": "...", "question": "...", "options": [] nebo vynech, "answer": "..." nebo pole, volitelně "explanation": "..." }',
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        },
      ],
      generationConfig: REGENERATE_GENERATION_CONFIG,
    });

    const rawText = result.response.text();
    if (!rawText || !rawText.trim()) {
      throw new Error("Model nevrátil žádný text.");
    }

    const jsonText = extractJsonFromText(rawText);
    let parsed: GeminiTask;
    try {
      parsed = JSON.parse(jsonText) as GeminiTask;
    } catch {
      throw new Error("Model nevrátil neplatný JSON.");
    }

    const simplified: WorksheetTask = {
      id: task.id,
      type: task.type,
      question:
        parsed.question != null && String(parsed.question).trim() !== ""
          ? parsed.question
          : task.question,
      options:
        task.type === "draw_picture" ? [] : (parsed.options ?? task.options ?? []),
      answer:
        task.type === "draw_picture"
          ? ""
          : (parsed.answer !== undefined && parsed.answer !== ""
            ? parsed.answer
            : task.answer),
      explanation: parsed.explanation ?? task.explanation,
    };

    return NextResponse.json(simplified);
  } catch (error) {
    console.error("worksheet-simplify-task-for-svp failed:", error);
    return NextResponse.json(
      { error: "Zjednodušení úlohy pro SVP se nezdařilo." },
      { status: 500 }
    );
  }
}
