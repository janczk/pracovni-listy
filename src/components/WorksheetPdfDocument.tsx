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
import { formatOptionWithLabel, getCorrectOptionIndex } from "@/lib/optionLabels";
import {
  getTaskTypeLabels,
  getWorksheetUiStrings,
  formatSubjectGrade,
  formatTrueFalseForDisplay,
  formatTrueFalseOptionDisplay,
} from "@/lib/worksheetLabelsByLanguage";

// Arial (Liberation Sans) – plná podpora české diakritiky, metrická náhrada Arial
Font.register({
  family: "Arial",
  fonts: [
    { src: "/fonts/LiberationSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/LiberationSans-Bold.ttf", fontWeight: 700 },
  ],
});

const MARGIN = 50;
const FOOTER_HEIGHT = 24;

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
    paddingBottom: MARGIN + FOOTER_HEIGHT,
    fontSize: 11,
    fontFamily: "Arial",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_HEIGHT,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 10,
    color: "#475569",
    fontFamily: "Arial",
    fontWeight: 700,
  },
  footerText: {
    fontSize: 10,
    color: "#475569",
    fontFamily: "Arial",
    fontWeight: 700,
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
  /** Větší prostor pro nákres u úlohy typu Nakresli obrázek */
  drawingSpace: {
    minHeight: 200,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
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

function TaskLabelPdf({
  label,
  capsStyle = {},
}: {
  label: string;
  capsStyle?: { textTransform?: "uppercase" };
}) {
  return (
    <Text style={[styles.taskLabel, capsStyle]}>
      {safeText(label)}
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
  const capsStyle = worksheet.allCapsForSvp ? { textTransform: "uppercase" as const } : {};
  const lang = worksheet.language ?? "Čeština";
  const taskLabels = getTaskTypeLabels(lang);
  const ui = getWorksheetUiStrings(lang);

  if (variant === "teacher") {
    return (
      <Document>
        <Page size="A4" style={styles.page} wrap>
          {logo}
          <Text style={[styles.answerKeyTitle, capsStyle]}>{ui.answerKeyTitle}</Text>
          <Text style={[styles.meta, capsStyle]}>
            {safeText(worksheet.title)}
            {" · "}
            {formatSubjectGrade(lang, worksheet.subject, worksheet.grade, worksheet.classLabel)}
          </Text>
          {worksheet.tasks.map((task, index) => (
            <Text key={task.id} style={[styles.answerItem, capsStyle]}>
              {`${index + 1}. ${
                task.type === "draw_picture"
                  ? "—"
                  : task.options && task.options.length > 0
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
                    ? (formatTrueFalseForDisplay(
                        Array.isArray(task.answer) ? task.answer[0] : task.answer,
                        lang
                      ) || "—")
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
          <View fixed style={styles.footer}>
            <Text
              render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
              style={styles.footerText}
            />
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {logo}
        <Text style={[styles.title, capsStyle]}>{safeText(worksheet.title)}</Text>
        <Text style={[styles.meta, capsStyle]}>
          {formatSubjectGrade(lang, worksheet.subject, worksheet.grade, worksheet.classLabel)}
        </Text>
        <Text style={[styles.nameLabel, capsStyle]}>{ui.nameLabel}</Text>
        <View style={styles.nameSpace} />
        <Text style={[styles.instructions, capsStyle]}>{safeText(worksheet.instructions)}</Text>

        {worksheet.tasks.map((task, index) => (
          <View key={task.id} style={styles.taskBlock} wrap={false}>
            <TaskLabelPdf label={taskLabels[task.type]} capsStyle={capsStyle} />
            <Text style={[styles.taskQuestion, capsStyle]}>
              {`${index + 1}. ${safeText(task.question)}`}
            </Text>
            {task.options && task.options.length > 0 && (
              <View style={styles.taskOptions}>
                {task.options.map((opt, j) => (
                  <View key={j} style={styles.taskOptionItem}>
                    <Text style={capsStyle}>{`• ${formatOptionWithLabel(j, task.type === "true_false" ? formatTrueFalseOptionDisplay(safeText(opt), lang) : safeText(opt))}`}</Text>
                  </View>
                ))}
              </View>
            )}
            {task.type === "true_false" && (
              <View style={styles.trueFalseChoiceRow}>
                <Text style={[styles.trueFalseOption, capsStyle]}>{ui.yes}</Text>
                <Text style={[styles.trueFalseOptionNe, capsStyle]}>{ui.no}</Text>
              </View>
            )}
            {(task.type === "short_answer" || task.type === "reading_questions") && (
              <View style={styles.writingSpace} />
            )}
            {task.type === "draw_picture" && (
              <View style={styles.drawingSpace} />
            )}
          </View>
        ))}
        <View fixed style={styles.footer}>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            style={styles.footerText}
          />
        </View>
      </Page>
    </Document>
  );
}
