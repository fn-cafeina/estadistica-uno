import { describe, expect, test } from "bun:test";
import { generateSample } from "../data/generator";
import { getCategoricalValue, getCategories, performanceLevel } from "../data/schema";
import { chiSquareTest } from "../stats/chiSquare";
import { pearsonCorrelation } from "../stats/correlation";

describe("generador de datos sintéticos", () => {
  test("genera el tamaño solicitado y respeta los rangos", () => {
    const sample = generateSample(80, 12345);
    expect(sample.n).toBe(80);
    expect(sample.rows).toHaveLength(80);

    for (const row of sample.rows) {
      expect(row.id).toBeGreaterThan(0);
      expect(row.age).toBeGreaterThanOrEqual(18);
      expect(row.age).toBeLessThanOrEqual(30);
      expect(row.year).toBeGreaterThanOrEqual(1);
      expect(row.year).toBeLessThanOrEqual(5);
      expect(row.screenHours).toBeGreaterThanOrEqual(1);
      expect(row.screenHours).toBeLessThanOrEqual(12);
      expect(row.studyHours).toBeGreaterThanOrEqual(0);
      expect(row.studyHours).toBeLessThanOrEqual(30);
      expect(row.socialHours).toBeGreaterThanOrEqual(0);
      expect(row.socialHours).toBeLessThanOrEqual(8);
      expect(row.sleepHours).toBeGreaterThanOrEqual(4);
      expect(row.sleepHours).toBeLessThanOrEqual(10);
      expect(row.gpa).toBeGreaterThanOrEqual(30);
      expect(row.gpa).toBeLessThanOrEqual(100);
    }
  });

  test("es determinista para la misma semilla y cambia con otra", () => {
    const first = generateSample(40, 777);
    const second = generateSample(40, 777);
    const third = generateSample(40, 778);

    expect(first.rows).toEqual(second.rows);
    expect(first.rows).not.toEqual(third.rows);
  });

  test("incluye todas las categorías en muestras pequeñas", () => {
    const sample = generateSample(40, 20260214);
    for (const key of ["sex", "major", "year", "studyTechFrequency", "device", "distraction", "perceivedImpact"] as const) {
      const categories = getCategories(key);
      const present = new Set(sample.rows.map((row) => getCategoricalValue(row, key)));
      expect(present.size).toBe(categories.length);
    }
  });

  test("produce relaciones moderadas y no perfectas", () => {
    const sample = generateSample(80, 20260214);
    const study = sample.rows.map((row) => row.studyHours);
    const gpa = sample.rows.map((row) => row.gpa);
    const screen = sample.rows.map((row) => row.screenHours);

    const studyCorrelation = pearsonCorrelation(study, gpa);
    const screenCorrelation = pearsonCorrelation(screen, gpa);

    expect(studyCorrelation).not.toBeNull();
    expect(screenCorrelation).not.toBeNull();
    expect(Math.abs(studyCorrelation?.r ?? 0)).toBeGreaterThan(0.2);
    expect(Math.abs(studyCorrelation?.r ?? 0)).toBeLessThan(0.9);
    expect(Math.abs(screenCorrelation?.r ?? 0)).toBeLessThan(0.9);
  });

  test("el par principal de chi-cuadrado tiene márgenes utilizables", () => {
    const sample = generateSample(80, 20260214);
    const pairs = sample.rows.map((row) => ({
      row: getCategoricalValue(row, "studyTechFrequency"),
      col: getCategoricalValue(row, "performanceLevel"),
    }));
    const result = chiSquareTest(
      pairs,
      getCategories("studyTechFrequency"),
      getCategories("performanceLevel"),
    );

    expect(result).not.toBeNull();
    expect(result?.total).toBe(80);
    expect(result?.expected.every((row) => row.every((value) => value > 0))).toBe(true);
    expect(result?.minExpected).toBeGreaterThan(0);
    expect(result?.degreesOfFreedom).toBe(6);
  });

  test("clasifica el promedio en tres niveles", () => {
    expect(performanceLevel(69.9)).toBe("Bajo");
    expect(performanceLevel(70)).toBe("Medio");
    expect(performanceLevel(79.9)).toBe("Medio");
    expect(performanceLevel(80)).toBe("Alto");
  });
});
