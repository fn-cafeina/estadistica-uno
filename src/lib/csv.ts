import { VARIABLES, formatCategoricalValue, isQualitativeKey } from "../data/schema";
import type { StudentRecord } from "../data/types";

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function rowsToCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\r\n");
}

export function recordsToCsv(records: readonly StudentRecord[]): string {
  const headers = [
    "id",
    ...VARIABLES.map((variable) => {
      if (variable.unit) return `${variable.label} (${variable.unit})`;
      if (variable.key === "year") return `${variable.label} (1-5)`;
      return variable.label;
    }),
  ];

  const rows = records.map((record) => [
    record.id,
    ...VARIABLES.map((variable) => {
      if (isQualitativeKey(variable.key)) {
        const value = record[variable.key] as string | number;
        return variable.key === "year"
          ? Number(formatCategoricalValue("year", String(value)))
          : value;
      }
      return record[variable.key as keyof StudentRecord];
    }),
  ]);

  return rowsToCsv(headers, rows);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function csvFilename(n: number, seed: number, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `tecnologia-rendimiento_n${n}_semilla-${seed}_${day}.csv`;
}
