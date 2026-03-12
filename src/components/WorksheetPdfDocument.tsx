"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Worksheet, WorksheetTask } from "@/types/worksheet";
import { TASK_TYPE_LABELS } from "@/lib/czech";
import { formatOptionWithLabel, getCorrectOptionIndex, formatTrueFalseAnswer } from "@/lib/optionLabels";

// Arial (Liberation Sans) – plná podpora české diakritiky, metrická náhrada Arial
Font.register({
  family: "Arial",
  fonts: [
    { src: "/fonts/LiberationSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/LiberationSans-Bold.ttf", fontWeight: 700 },
  ],
});

const MARGIN = 50;

/** @react-pdf/renderer vyžaduje, aby děti <Text> byly řetězce. */
function safeText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(safeText).join(", ");
  return String(value);
}

const styles = StyleSheet.create({
  page: {
    padding: MARGIN,
    fontSize: 11,
    fontFamily: "Arial",
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 700,
  },
  meta: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 8,
  },
  /** Řádek „Jméno a příjmení:“ pod názvem listu */
  nameLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  /** Prostor na vyplnění jména (i pro tablet/dotykové pero) */
  nameSpace: {
    minHeight: 44,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
  },
  instructions: {
    fontSize: 11,
    marginBottom: 20,
    lineHeight: 1.4,
  },
  taskBlock: {
    marginBottom: 14,
  },
  taskLabel: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  taskQuestion: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  taskOptions: {
    marginLeft: 16,
    marginTop: 4,
    fontSize: 10,
  },
  /** Jedna možnost A)/B)/C)/D) – větší mezera kvůli kroužkování */
  taskOptionItem: {
    marginBottom: 14,
  },
  /** Řádek „Ano“ / „Ne“ u Pravda/Nepravda – stejný vzhled jako název typu úlohy */
  trueFalseChoiceRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  trueFalseOption: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
  },
  trueFalseOptionNe: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginLeft: 48,
  },
  /** Prázdný prostor pro psaní odpovědi u úloh s textem */
  writingSpace: {
    minHeight: 72,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  answerKeyTitle: {
    fontSize: 14,
    marginTop: 24,
    marginBottom: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontWeight: 700,
  },
  answerItem: {
    marginBottom: 4,
    fontSize: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
});

function TaskLabelPdf({ type }: { type: WorksheetTask["type"] }) {
  return (
    <Text style={styles.taskLabel}>
      {safeText(TASK_TYPE_LABELS[type as keyof typeof TASK_TYPE_LABELS] ?? type)}
    </Text>
  );
}

export type PdfVariant = "student" | "teacher";

/**
 * PDF dokument – formát A4, pouze řádné písmo (bez tučného).
 * variant "student" = pracovní list pro žáky (bez klíče).
 * variant "teacher" = pouze klíč správných odpovědí pro učitele.
 * logoUrl = absolutní URL loga (např. z window.location.origin + '/logo.png').
 */
export function WorksheetPdfDocument({
  worksheet,
  variant,
  logoUrl,
}: {
  worksheet: Worksheet;
  variant: PdfVariant;
  logoUrl?: string;
}) {
  const logo = logoUrl ? (
    <Image source={{ uri: logoUrl }} style={styles.logo} />
  ) : null;

  if (variant === "teacher") {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {logo}
          <Text style={styles.answerKeyTitle}>Klíč správných odpovědí</Text>
          <Text style={styles.meta}>
            {safeText(worksheet.title)}
            {" · "}
            {safeText(worksheet.subject)}
            {" · "}
            {safeText(worksheet.grade)}
            {" ročník"}
            {worksheet.classLabel ? `, ${safeText(worksheet.classLabel)}` : ""}
          </Text>
          {worksheet.tasks.map((task, index) => (
            <Text key={task.id} style={styles.answerItem}>
              {`${index + 1}. ${
                task.options && task.options.length > 0
                  ? (() => {
                      const idx = getCorrectOptionIndex(task.options, task.answer);
                      if (idx >= 0)
                        return formatOptionWithLabel(idx, task.options[idx]);
                      const a = task.answer;
                      return a != null
                        ? Array.isArray(a)
                          ? a.join(", ")
                          : String(a)
                        : "—";
                    })()
                  : task.type === "true_false"
                    ? (formatTrueFalseAnswer(
                        Array.isArray(task.answer) ? task.answer[0] : task.answer
                      ) ?? "—")
                    : (() => {
                        const a = task.answer;
                        return a != null
                          ? Array.isArray(a)
                            ? a.join(", ")
                            : String(a)
                          : "—";
                      })()
              }`}
            </Text>
          ))}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {logo}
        <Text style={styles.title}>{safeText(worksheet.title)}</Text>
        <Text style={styles.meta}>
          {safeText(worksheet.subject)}
          {" · "}
          {safeText(worksheet.grade)}
          {" ročník"}
          {worksheet.classLabel ? `, ${safeText(worksheet.classLabel)}` : ""}
        </Text>
        <Text style={styles.nameLabel}>Jméno a příjmení:</Text>
        <View style={styles.nameSpace} />
        <Text style={styles.instructions}>{safeText(worksheet.instructions)}</Text>

        {worksheet.tasks.map((task, index) => (
          <View key={task.id} style={styles.taskBlock} wrap={false}>
            <TaskLabelPdf type={task.type} />
            <Text style={styles.taskQuestion}>
              {`${index + 1}. ${safeText(task.question)}`}
            </Text>
            {task.options && task.options.length > 0 && (
              <View style={styles.taskOptions}>
                {task.options.map((opt, j) => (
                  <View key={j} style={styles.taskOptionItem}>
                    <Text>{`• ${formatOptionWithLabel(j, safeText(opt))}`}</Text>
                  </View>
                ))}
              </View>
            )}
            {task.type === "true_false" && (
              <View style={styles.trueFalseChoiceRow}>
                <Text style={styles.trueFalseOption}>Ano</Text>
                <Text style={styles.trueFalseOptionNe}>Ne</Text>
              </View>
            )}
            {(task.type === "short_answer" || task.type === "reading_questions") && (
              <View style={styles.writingSpace} />
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}
