import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getGeminiModel } from "@/services/geminiClient";
import type { TextbookInput } from "@/types/inputs";
import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import { recordGeneration } from "@/lib/analyticsServer";
import { randomizeTaskOrder } from "@/lib/taskOrder";
import { buildTextbookTitle, getWorksheetLocale } from "@/lib/worksheetLocale";

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
                "Na základě následujícího textu vytvoř pracovní list.",
                "",
                "TEXT Z UČEBNICE:",
                body.extractedText.slice(0, 6000),
                "",
                `Předmět: ${body.subject}, ročník: ${body.grade}.`,
                `Účel: ${body.useCase}. Obtížnost: ${body.difficulty}.`,
                "",
                `DŮLEŽITÉ – Jazyk výstupu: Celý pracovní list musí být vygenerován výhradně v jazyce: ${lang}. Všechny texty v JSON (otázky, možnosti u výběru, správné odpovědi, vysvětlení) piš pouze v tomto jazyce. Nic nepiš v jiném jazyce.`,
                "",
                audienceInstruction,
                "",
                "Všechny otázky musí vycházet výhradně z přiloženého textu.",
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

