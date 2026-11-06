import { describe, expect, test } from "bun:test";
import { recordsToCsv } from "../lib/csv";
import { generateSample } from "../data/generator";
import { DEFAULT_SAMPLE_SIZE, DEFAULT_SEED } from "../data/types";

function csvFields(): Array<string[] | null> {
  const sample = generateSample(DEFAULT_SAMPLE_SIZE, DEFAULT_SEED);
  return recordsToCsv(sample.rows).split("\r\n").map((line) => line.split(","));
}

describe("exportación CSV", () => {
  test("no produce campos vacíos ni NaN", () => {
    const fields = csvFields();
    expect(fields).toHaveLength(DEFAULT_SAMPLE_SIZE + 1);

    for (const row of fields) {
      expect(row).not.toBeNull();
      for (const cell of row as string[]) {
        expect(cell).not.toBe("");
        expect(cell).not.toBe("NaN");
      }
    }
  });

  test("exporta el año académico como número del 1 al 5", () => {
    const fields = csvFields();
    const header = fields[0] as string[];
    const yearIndex = header.findIndex((column) => column.startsWith("Año académico"));
    expect(yearIndex).toBe(4);

    for (const row of fields.slice(1)) {
      const year = Number((row as string[])[yearIndex]);
      expect(Number.isInteger(year)).toBe(true);
      expect(year).toBeGreaterThanOrEqual(1);
      expect(year).toBeLessThanOrEqual(5);
    }
  });

  test("mantiene el orden de columnas: id y trece variables", () => {
    const fields = csvFields();
    const header = fields[0] as string[];
    expect(header).toHaveLength(14);
    expect(header[0]).toBe("id");
    expect(header[1]).toBe("Edad (años)");
    expect(header[header.length - 1]).toBe("Horas de sueño por noche (h/noche)");
  });
});
