import { NextResponse } from "next/server";
import { getGeminiModel } from "@/services/geminiClient";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";

interface RequestBody {
  worksheet: Worksheet;
}

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
    const withoutFence = lines.slice(1);
    if (withoutFence.length && withoutFence[withoutFence.length - 1].trim().startsWith("```")) {
      withoutFence.pop();
    }
    return withoutFence.join("\n").trim();
  }
  return trimmed;
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
          `Úloha ${i + 1} (typ: ${t.type}): otázka="${(t.question || "").trim()}"${t.options?.length ? `, možnosti=${JSON.stringify(t.options)}` : ""}, správná odpověď=${JSON.stringify(t.answer ?? "")}`
      )
      .join("\n");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Máš pracovní list pro běžnou základní školu. Vytvoř z něj verzi pro žáky se SVP (speciální vzdělávací potřeby): STEJNÉ otázky a STEJNÉ správné odpovědi, pouze zjednodušený jazyk pro snazší porozumění psanému textu.",
                "",
                `Jazyk výstupu: List je v jazyce ${lang}. Veškerý text výstupu musí zůstat v tomto jazyce (včetně odpovědí u pravda/nepravda – např. Pravda/Nepravda nebo Ano/Ne v češtině, nikdy anglické true/false).`,
                "",
                "Pravidla:",
                "1) Výstup musí vycházet ze stejných otázek a odpovědí jako běžný list – neměň obsah, význam ani správnou odpověď. Mění se jen formulace (kratší věty, jednodušší slova).",
                "2) U výběru z možností: zachovej stejný počet možností, stejné pořadí a stejnou správnou odpověď (stejná možnost musí zůstat správná).",
                "3) U pravda/nepravda: zachovej stejný smysl tvrzení a stejnou odpověď; text odpovědi piš ve stejném jazyce jako zbytek listu (ne anglické true/false).",
                "4) Počet úloh a jejich typy musí zůstat beze změny. Vrať přesně tolik úloh, kolik je vstupních, ve stejném pořadí.",
                hasEmptyAnswer
                  ? "5) U úloh, kde je správná odpověď prázdná (kromě draw_picture), zjednoduš otázku a doplň vhodnou krátkou správnou odpověď v jednoduchém jazyce pro žáky se SVP."
                  : "",
                "6) U úloh typu draw_picture (nakresli obrázek) zjednoduš pouze znění otázky, pole answer nech prázdné.",
                "",
                "Běžný pracovní list (úlohy):",
                tasksDescription,
                "",
                "Odpověz pouze validním JSON ve tvaru: { \"tasks\": [ { \"type\": \"...\", \"question\": \"...\", \"options\": [...] nebo vynech, \"answer\": \"...\" nebo pole, volitelně \"explanation\": \"...\" } ] }",
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
    if (!jsonText) {
      throw new Error("V odpovědi modelu chybí JSON.");
    }

    let parsed: GeminiResponse;
    try {
      parsed = JSON.parse(jsonText) as GeminiResponse;
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
