import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getGeminiModel } from "@/services/geminiClient";
import type { TextbookInput } from "@/types/inputs";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { createMockWorksheet } from "@/lib/mockData";

type RequestBody = TextbookInput;

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

    const isSvp = body.simplifiedVersion === true || body.schoolType === "svp";
    const audienceInstruction = isSvp
      ? [
          "DŮLEŽITÉ – Tento výstup je pro ŽÁKY SE SPECIÁLNÍMI VZDĚLÁVACÍMI POTŘEBAMI (SVP).",
          "Pracovní list musí být výrazně zjednodušen: kratší věty, jednodušší slovní zásoba, nižší nároky na porozumění textu.",
          "Tito žáci jsou často pomalejší, mohou mít různé typy hendikepů a věci chápou hůře – obsah musí být přizpůsoben jejich možnostem.",
          "Nevyžaduj stejný standard jako u běžného pracovního listu; odpovědi mohou být formulovány jednodušeji a stručněji.",
        ].join(" ")
      : [
          "Tento výstup je pro BĚŽNOU ZÁKLADNÍ ŠKOLU.",
          "Otázky a odpovědi mají odpovídat standardní úrovni žáků bez speciálních potřeb.",
        ].join(" ");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Jsi učitel na české základní škole.",
                "Na základě následujícího textu vytvoř pracovní list.",
                "",
                "TEXT Z UČEBNICE:",
                body.extractedText.slice(0, 6000),
                "",
                `Předmět: ${body.subject}, ročník: ${body.grade}.`,
                `Účel: ${body.useCase}. Obtížnost: ${body.difficulty}.`,
                "",
                audienceInstruction,
                "",
                "Vytvoř pouze seznam úloh (questions) bez úvodního textu.",
                "Drž se počtů typů úloh (taskTypeCounts):",
                JSON.stringify(body.taskTypeCounts),
                "Typy úloh:",
                "- multiple_choice: výběr z možností A-D, přesně 3–4 možnosti.",
                "- true_false: tvrzení s odpovědí \"true\" nebo \"false\".",
                "- fill_in: doplňovačka s jedním krátkým slovem nebo rokem.",
                "- short_answer: krátká otevřená odpověď (1–2 věty).",
                "- reading_questions: otázky, na které žák odpoví podle textu.",
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

    const tasks: WorksheetTask[] = (parsed.tasks ?? []).map((t) => ({
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
      title: `Pracovní list: ${body.subject} – z učebnice`,
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      language: "Čeština",
      sourceType: "textbook",
      sourceText: body.extractedText,
      instructions: "Na základě přečteného textu odpovězte na následující otázky.",
      difficulty: body.difficulty,
      useCase: body.useCase,
      taskTypes: usedTypes,
      tasks,
      answersVisible: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(worksheet);
  } catch (error) {
    console.error("Gemini worksheet-from-textbook failed, using mock:", error);
    const mock = createMockWorksheet({
      sourceType: "textbook",
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      difficulty: body.difficulty,
      useCase: body.useCase,
    });
    return NextResponse.json(mock, { status: 200 });
  }
}

