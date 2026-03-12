import { NextResponse } from "next/server";
import { getGeminiModel } from "@/services/geminiClient";
import type { Worksheet, WorksheetTask } from "@/types/worksheet";

interface RequestBody {
  worksheet: Worksheet;
  taskId: string;
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

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo požadavku." }, { status: 400 });
  }

  const existing = body.worksheet.tasks.find((t) => t.id === body.taskId);
  const type = existing?.type ?? "short_answer";
  const isManual = existing?.id.startsWith("manual-") ?? false;

  try {
    const model = getGeminiModel();

    const topic = body.worksheet.title.replace(/^Pracovní list:\s*/i, "");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Jsi učitel na české základní škole.",
                `Regeneruj jednu novou úlohu typu "${type}" k tématu pracovního listu "${topic}".`,
                `Předmět: ${body.worksheet.subject}, ročník: ${body.worksheet.grade}.`,
                "Zachovej jazyk a styl vhodný pro daný ročník.",
                "",
                "Pravidla podle typu úlohy:",
                '- pokud je typ "true_false", musíš vrátit úplně stejnou otázku jako zadal učitel a pole "answer" musí být pouze "true"/"false" (můžeš uvažovat, že "pravda"/"ano" = "true" a "nepravda"/"ne" = "false"); žádné pole options nepoužívej, nebo ho nech prázdné.',
                '- pokud je typ "multiple_choice", v poli "options" vrať 3–4 textové možnosti bez písmen (bez "A)", "B)" atd.) a v poli "answer" vrať text správné možnosti přesně tak, jak je uveden v options.',
                "- u ostatních typů vrať krátký text odpovědi v poli answer.",
                existing?.question
                  ? [
                      "",
                      "Použij tuto otázku, kterou zadal učitel:",
                      `"${existing.question}"`,
                      "",
                      "Do pole \"question\" vrať finální znění otázky tak, jak ji má vidět žák (můžeš ji upravit, zjednodušit nebo přeformulovat).",
                    ].join("\n")
                  : "",
                "",
                "Odpověz jako JSON ve tvaru:",
                '{ "type": "...", "question": "...", "options": ["A", "B"], "answer": "...", "explanation": "..." }',
              ].join("\n"),
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
    const parsed = JSON.parse(jsonText) as Omit<WorksheetTask, "id">;

    let answer: WorksheetTask["answer"] = parsed.answer;
    let options: WorksheetTask["options"] = parsed.options;

    if (type === "true_false") {
      const raw =
        Array.isArray(parsed.answer) && parsed.answer.length > 0
          ? parsed.answer[0]
          : (parsed.answer as string | undefined);
      const norm = (raw ?? "").toString().trim().toLowerCase();
      if (norm === "true" || norm === "pravda" || norm === "ano") {
        answer = "true";
      } else if (norm === "false" || norm === "nepravda" || norm === "ne") {
        answer = "false";
      } else {
        // pokud je odpověď neurčitá, raději necháme false
        answer = "false";
      }
      options = [];
    }

    const task: WorksheetTask = {
      id: body.taskId,
      type: parsed.type ?? type,
      // U vlastních (manuálních) úloh necháme model otázku přeformulovat,
      // u ostatních úloh zachováme původní otázku.
      question: isManual
        ? parsed.question ?? existing?.question ?? ""
        : existing?.question ?? "",
      options,
      answer,
      explanation: parsed.explanation,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error("Gemini regenerate-task failed:", error);
    return NextResponse.json(
      { error: "Generování úlohy se nezdařilo. Zkuste to prosím znovu." },
      { status: 500 }
    );
  }
}

