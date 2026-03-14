/**
 * Lokalizované titulky a instrukce pracovního listu podle zvoleného jazyka.
 * Používá se pro celý výstup ve zvoleném jazyce (název, zadání).
 */
export type WorksheetLocale = {
  titlePrefixTopic: string;
  instructionsTopic: string;
  /** Prefix před předmětem (např. "Pracovní list: ") */
  titlePrefixTextbook: string;
  /** Suffix za předmětem (např. " – z učebnice") */
  titleSuffixTextbook: string;
  instructionsTextbook: string;
};

const LOCALES: Record<string, WorksheetLocale> = {
  Čeština: {
    titlePrefixTopic: "Pracovní list: ",
    instructionsTopic: "Vyplň pracovní list podle zadání.",
    titlePrefixTextbook: "Pracovní list: ",
    titleSuffixTextbook: " – z učebnice",
    instructionsTextbook: "Na základě přečteného textu odpovězte na následující otázky.",
  },
  Angličtina: {
    titlePrefixTopic: "Worksheet: ",
    instructionsTopic: "Complete the worksheet according to the instructions.",
    titlePrefixTextbook: "Worksheet: ",
    titleSuffixTextbook: " – from textbook",
    instructionsTextbook: "Based on the text you read, answer the following questions.",
  },
  Němčina: {
    titlePrefixTopic: "Arbeitsblatt: ",
    instructionsTopic: "Fülle das Arbeitsblatt gemäß der Anweisungen aus.",
    titlePrefixTextbook: "Arbeitsblatt: ",
    titleSuffixTextbook: " – aus dem Lehrbuch",
    instructionsTextbook: "Beantworte die folgenden Fragen auf der Grundlage des gelesenen Textes.",
  },
  Francouzština: {
    titlePrefixTopic: "Fiche de travail : ",
    instructionsTopic: "Complète la fiche selon les consignes.",
    titlePrefixTextbook: "Fiche de travail : ",
    titleSuffixTextbook: " – tiré du manuel",
    instructionsTextbook: "En te basant sur le texte lu, réponds aux questions suivantes.",
  },
  Španělština: {
    titlePrefixTopic: "Ficha de trabajo: ",
    instructionsTopic: "Completa la ficha según las instrucciones.",
    titlePrefixTextbook: "Ficha de trabajo: ",
    titleSuffixTextbook: " – del libro de texto",
    instructionsTextbook: "Según el texto leído, responde a las siguientes preguntas.",
  },
  Ukrajinština: {
    titlePrefixTopic: "Робочий лист: ",
    instructionsTopic: "Заповніть робочий лист згідно з інструкціями.",
    titlePrefixTextbook: "Робочий лист: ",
    titleSuffixTextbook: " – з підручника",
    instructionsTextbook: "На основі прочитаного тексту дайте відповіді на наступні запитання.",
  },
};

const DEFAULT_LOCALE: WorksheetLocale = LOCALES["Čeština"]!;

export function getWorksheetLocale(language: string): WorksheetLocale {
  return LOCALES[language] ?? DEFAULT_LOCALE;
}

export function buildTopicTitle(language: string, topic: string): string {
  const loc = getWorksheetLocale(language);
  return `${loc.titlePrefixTopic}${topic}`.trim();
}

export function buildTextbookTitle(language: string, subject: string): string {
  const loc = getWorksheetLocale(language);
  return `${loc.titlePrefixTextbook}${subject}${loc.titleSuffixTextbook}`.trim();
}
