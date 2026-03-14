import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getGeminiModel } from "@/services/geminiClient";
import type { TopicInput } from "@/types/inputs";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { createMockWorksheet } from "@/lib/mockData";
import { recordGeneration } from "@/lib/analyticsServer";
import { randomizeTaskOrder } from "@/lib/taskOrder";
import { buildTopicTitle, getWorksheetLocale } from "@/lib/worksheetLocale";

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
    let model;
    try {
      model = getGeminiModel();
    } catch (geminiErr) {
      console.error("worksheet-from-topic: Gemini není nakonfigurován", geminiErr);
      return NextResponse.json(
        { error: "Generování vyžaduje API klíč (GEMINI_API_KEY). Přidejte ho do .env.local a restartujte server." },
        { status: 503 }
      );
    }

    const totalRequested =
      (body.taskTypeCounts.multiple_choice ?? 0) +
      (body.taskTypeCounts.true_false ?? 0) +
      (body.taskTypeCounts.fill_in ?? 0) +
      (body.taskTypeCounts.short_answer ?? 0) +
      (body.taskTypeCounts.reading_questions ?? 0) +
      (body.taskTypeCounts.draw_picture ?? 0);

    // Pro LMP generujeme podle RVP ZV–LMP (příloha upravující vzdělávání žáků s LMP); pro běžnou ZŠ standardní.
    const isLmp = body.schoolType === "lmp";
    const audienceInstruction = isLmp
      ? [
          "Tento výstup je pro ZÁKLADNÍ ŠKOLU PRO ŽÁKY S LEHKÝM MENTÁLNÍM POSTIŽENÍM (LMP), v souladu s RVP ZV–LMP.",
          "Respektuj sníženou úroveň rozumových schopností žáků: u nich převažuje myšlení názorné a konkrétní, logické uvažování je spjaté s realitou; abstrakce omezená.",
          "Pravidla pro text: JEDNODUCHÁ SLOVA, KRÁTKÉ VĚTY (řádově do 10–12 slov). Vyhni se cizím a odborným výrazům, nebo je hned jednoduše vysvětli.",
          "Úlohy mají mít činnostní povahu, být prakticky zaměřené a využitelné v běžném životě. U každé úlohy méně pojmů, JASNÉ A STRUČNÉ instrukce, jeden krok nebo jeden jasný cíl.",
          "Preferuj konkrétní a názorné úlohy před abstraktními. Obtížnost a tempo přizpůsob možnostem žáků s LMP; obsah musí být pro ně dosažitelný.",
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
                "Jsi učitel na základní škole.",
                `Vytvoř pracovní list k tématu: "${body.topic}".`,
                `Předmět: ${body.subject}, ročník: ${body.grade}.`,
                `Účel: ${body.useCase}. Obtížnost: ${body.difficulty}.`,
                "",
                `DŮLEŽITÉ – Jazyk výstupu: Celý pracovní list musí být vygenerován výhradně v jazyce: ${body.language}. Všechny texty v JSON (otázky, možnosti u výběru, správné odpovědi, vysvětlení) piš pouze v tomto jazyce. Nic nepiš v jiném jazyce.`,
                "",
                audienceInstruction,
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
                '- draw_picture: úloha, kde má žák něco NAKRESLIT (schéma, obrázek, náčrtek). Formuluj otázku tak, aby výstupem žáka byl nákres (např. "Nakresli jednoduché schéma fotosyntézy.", "Nakresli potravní řetězec v lese."). Pole "answer" neuváděj nebo nech prázdné – odpověď žáka je kresba.',
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
      answer: t.type === "draw_picture" ? "" : t.answer,
      explanation: t.explanation,
    }));

    if (!tasks.length) {
      throw new Error("Model nevrátil žádné úlohy.");
    }

    const orderedTasks = randomizeTaskOrder(tasks);
    const usedTypes = Array.from(new Set(orderedTasks.map((t) => t.type))) as TaskType[];

    const locale = getWorksheetLocale(body.language);
    const worksheet: Worksheet = {
      id: `ws-${Date.now()}`,
      title: buildTopicTitle(body.language, body.topic),
      schoolType: body.schoolType,
      subject: body.subject,
      grade: body.grade,
      classLabel: body.classLabel,
      language: body.language,
      sourceType: "topic",
      sourceText: undefined,
      instructions: locale.instructionsTopic,
      difficulty: body.difficulty,
      useCase: body.useCase,
      taskTypes: usedTypes,
      tasks: orderedTasks,
      answersVisible: body.includeAnswers,
      createdAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    const betaUserId = cookieStore.get("beta_access")?.value;
    await recordGeneration(
      {
        generated: 1,
        basicAndLmp: body.schoolType === "lmp" ? 1 : 0,
      },
      betaUserId
    );

    return NextResponse.json(worksheet);
  } catch (error) {
    console.error("worksheet-from-topic failed:", error);
    const message =
      error instanceof Error ? error.message : "Generování pracovního listu selhalo.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

