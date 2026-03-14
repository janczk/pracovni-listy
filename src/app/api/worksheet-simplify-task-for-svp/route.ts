import { NextResponse } from "next/server";
import { getGeminiModel } from "@/services/geminiClient";
import type { WorksheetTask, TaskType } from "@/types/worksheet";

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
                "Máš jednu úlohu z pracovního listu pro běžnou ZŠ. Vytvoř její verzi pro žáky se SVP: STEJNÁ otázka a STEJNÁ správná odpověď, pouze zjednodušený jazyk.",
                "",
                "Jazyk výstupu: Veškerý text (otázka, možnosti, odpověď) musí zůstat ve stejném jazyce jako původní úloha. U pravda/nepravda piš odpověď v tomto jazyce (např. Pravda/Nepravda nebo Ano/Ne), nikdy anglické true/false.",
                "",
                "Pravidla:",
                "1) Neměň obsah, význam ani správnou odpověď. Mění se jen formulace (kratší věty, jednodušší slova).",
                "2) U výběru z možností: zachovej stejný počet možností, stejné pořadí a stejnou správnou odpověď.",
                "3) U pravda/nepravda: zachovej stejný smysl a stejnou odpověď; text odpovědi ve stejném jazyce jako zbytek (ne true/false).",
                hasEmptyAnswer && task.type !== "draw_picture"
                  ? "4) Správná odpověď je prázdná – zjednoduš otázku a doplň vhodnou krátkou správnou odpověď v jednoduchém jazyce."
                  : "4) Zachovej typ úlohy.",
                task.type === "draw_picture"
                  ? "5) U draw_picture zjednoduš pouze znění otázky, pole answer nech prázdné."
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
