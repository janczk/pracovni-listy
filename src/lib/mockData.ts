import type { Worksheet, WorksheetTask, TaskType } from "@/types/worksheet";

/** Vzorové úlohy pro mock generování – v češtině; více variant na typ pro „počet otázek“ */
export const sampleTasks: WorksheetTask[] = [
  {
    id: "t1",
    type: "multiple_choice",
    question: "Kdo byl Karel IV.?",
    options: [
      "král Francie",
      "římský císař a český král",
      "pouze český král",
      "papež",
    ],
    answer: "římský císař a český král",
    explanation: "Karel IV. byl římský císař a český král.",
  },
  {
    id: "t1b",
    type: "multiple_choice",
    question: "Kdy byla založena Univerzita Karlova?",
    options: ["1347", "1348", "1350", "1360"],
    answer: "1348",
    explanation: "Univerzita Karlova byla založena roku 1348.",
  },
  {
    id: "t2",
    type: "true_false",
    question: "Karel IV. založil Univerzitu Karlovu v Praze.",
    answer: "true",
    explanation: "Univerzita Karlova byla založena roku 1348.",
  },
  {
    id: "t2b",
    type: "true_false",
    question: "Karel IV. vládl pouze v Čechách.",
    answer: "false",
    explanation: "Byl také římský císař.",
  },
  {
    id: "t3",
    type: "fill_in",
    question: "Karel IV. se narodil v roce ______.",
    answer: "1316",
    explanation: "Narodil se 14. května 1316.",
  },
  {
    id: "t3b",
    type: "fill_in",
    question: "Karlův most spojuje Malou Stranu a ______.",
    answer: "Staré Město",
    explanation: "Vedl přes Vltavu na Staré Město.",
  },
  {
    id: "t4",
    type: "short_answer",
    question: "Jmenuj jednu významnou stavbu, kterou Karel IV. v Praze inicioval.",
    answer: "Karlův most",
    explanation: "Karlův most je jednou z jeho známých staveb.",
  },
  {
    id: "t4b",
    type: "short_answer",
    question: "Který řád Karel IV. podporoval při stavbě klášterů?",
    answer: "cisterciáci",
    explanation: "Podporoval řády včetně cisterciáků.",
  },
  {
    id: "t5",
    type: "reading_questions",
    question: "Proč byl podle textu Karel IV. důležitý pro vzdělávání?",
    answer: "Založil první univerzitu ve střední Evropě.",
    explanation: "Univerzita Karlova byla první univerzitou v regionu.",
  },
  {
    id: "t5b",
    type: "reading_questions",
    question: "Jaký vliv měl Karel IV. na rozvoj Prahy?",
    answer: "Podporoval stavby a zvelebování města.",
    explanation: "Praha za něj rostla a stala se centrem říše.",
  },
  {
    id: "t6",
    type: "draw_picture",
    question: "Nakresli jednoduché schéma znázorňující vztah Karla IV. k Praze (např. stavby, univerzita).",
    answer: "",
    options: [],
  },
];

/** Úlohy seskupené podle typu pro generování více otázek jednoho typu */
export const sampleTasksByType: Record<TaskType, WorksheetTask[]> = {
  multiple_choice: sampleTasks.filter((t) => t.type === "multiple_choice"),
  true_false: sampleTasks.filter((t) => t.type === "true_false"),
  fill_in: sampleTasks.filter((t) => t.type === "fill_in"),
  short_answer: sampleTasks.filter((t) => t.type === "short_answer"),
  reading_questions: sampleTasks.filter((t) => t.type === "reading_questions"),
  draw_picture: sampleTasks.filter((t) => t.type === "draw_picture"),
};

export function createMockWorksheet(overrides: Partial<Worksheet> = {}): Worksheet {
  return {
    id: `ws-${Date.now()}`,
    title: "Pracovní list: Karel IV. a středověké Čechy",
    schoolType: "basic",
    subject: "Dějepis",
    grade: "6",
    language: "Čeština",
    sourceType: "topic",
    instructions: "Přečtěte si každou otázku. Odpovědi pište do vyznačeného prostoru. U výběru z možností zakroužkujte písmeno správné odpovědi (A, B, C, D).",
    difficulty: "normal",
    useCase: "revision",
    taskTypes: ["multiple_choice", "true_false", "fill_in", "short_answer", "reading_questions", "draw_picture"],
    tasks: sampleTasks.slice(0, 5).map((t) => ({ ...t, id: `task-${Date.now()}-${t.id}` })),
    answersVisible: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
