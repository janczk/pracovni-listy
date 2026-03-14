import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";
import type { TopicInput, TextbookInput } from "@/types/inputs";
import { createMockWorksheet, sampleTasks } from "@/lib/mockData";

const API_TOPIC = "/api/worksheet-from-topic";
const API_TEXTBOOK = "/api/worksheet-from-textbook";
const API_REGENERATE = "/api/worksheet-regenerate-task";
const API_SIMPLIFY_SVP = "/api/worksheet-simplify-for-svp";
const API_SIMPLIFY_TASK_SVP = "/api/worksheet-simplify-task-for-svp";

async function postJson<TInput, TOutput>(url: string, body: TInput): Promise<TOutput> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Požadavek selhal (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error && typeof data.error === "string") message = data.error;
    } catch {
      // ignorovat chybu parsování
    }
    throw new Error(message);
  }
  return (await res.json()) as TOutput;
}

export async function generateWorksheetFromTopic(input: TopicInput): Promise<Worksheet> {
  try {
    return await postJson<TopicInput, Worksheet>(API_TOPIC, input);
  } catch (err) {
    console.error("generateWorksheetFromTopic failed:", err);
    throw err;
  }
}

export async function generateWorksheetFromSourceText(
  input: TextbookInput
): Promise<Worksheet> {
  try {
    return await postJson<TextbookInput, Worksheet>(API_TEXTBOOK, input);
  } catch (err) {
    console.error("generateWorksheetFromSourceText failed:", err);
    throw err;
  }
}

export async function regenerateSingleTask(
  worksheet: Worksheet,
  taskId: string
): Promise<WorksheetTask> {
  try {
    return await postJson<
      { worksheet: Worksheet; taskId: string },
      WorksheetTask
    >(API_REGENERATE, { worksheet, taskId });
  } catch (err) {
    console.error("regenerateSingleTask failed:", err);
    throw err;
  }
}

/**
 * Vytvoří z běžného pracovního listu verzi pro SVP: stejné otázky a odpovědi,
 * text zjednodušený pro snazší porozumění psanému textu.
 */
export async function simplifyWorksheetForSvp(worksheet: Worksheet): Promise<Worksheet> {
  try {
    return await postJson<{ worksheet: Worksheet }, Worksheet>(API_SIMPLIFY_SVP, {
      worksheet,
    });
  } catch (err) {
    console.error("simplifyWorksheetForSvp failed:", err);
    throw err;
  }
}

/**
 * Zjednoduší jednu úlohu pro SVP. Použij pro inkrementální aktualizaci SVP verze.
 */
export async function simplifyTaskForSvp(task: WorksheetTask): Promise<WorksheetTask> {
  try {
    return await postJson<{ task: WorksheetTask }, WorksheetTask>(API_SIMPLIFY_TASK_SVP, {
      task,
    });
  } catch (err) {
    console.error("simplifyTaskForSvp failed:", err);
    throw err;
  }
}

