import { describe, expect, test } from "bun:test";
import { categoricalFrequency, groupedFrequency, sturgesBins } from "../stats/frequency";

describe("distribuciones de frecuencia", () => {
  test("calcula frecuencias absolutas, relativas, porcentuales y acumuladas", () => {
    const result = categoricalFrequency(["A", "B", "A", "C", "A"], {
      order: ["A", "B", "C"],
      includeZero: true,
    });

    expect(result.total).toBe(5);
    expect(result.hasCumulative).toBe(true);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toMatchObject({
      value: "A",
      count: 3,
      relative: 0.6,
      percent: 60,
      cumulative: 3,
      cumulativePercent: 60,
    });
    expect(result.rows[2]?.cumulative).toBe(5);
    expect(result.rows.reduce((sum, row) => sum + row.count, 0)).toBe(5);
    expect(result.rows.reduce((sum, row) => sum + row.percent, 0)).toBeCloseTo(100, 10);
  });

  test("incluye categorías sin observaciones cuando se da el orden", () => {
    const result = categoricalFrequency(["A", "A"], { order: ["A", "B"], includeZero: true });
    expect(result.rows.map((row) => row.count)).toEqual([2, 0]);
    expect(result.rows[1]?.percent).toBe(0);
  });

  test("agrupa datos continuos y conserva el total", () => {
    const values = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = groupedFrequency(values, 5);

    expect(result.total).toBe(10);
    expect(result.k).toBe(5);
    expect(result.rows).toHaveLength(5);
    expect(result.rows.reduce((sum, row) => sum + row.count, 0)).toBe(10);
    expect(result.rows[0]?.lower).toBe(1);
    expect(result.rows.at(-1)?.upper).toBe(9);
    expect(result.rows[0]?.mark).toBeGreaterThanOrEqual(1);
    expect(result.rows[0]?.mark).toBeLessThanOrEqual(9);
  });

  test("maneja datos constantes con un solo intervalo", () => {
    const result = groupedFrequency([7, 7, 7], 5);
    expect(result.constant).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.count).toBe(3);
    expect(result.rows[0]?.mark).toBe(7);
    expect(result.width).toBe(0);
  });

  test("maneja una muestra vacía y calcula Sturges", () => {
    expect(groupedFrequency([]).rows).toEqual([]);
    expect(sturgesBins(0)).toBe(1);
    expect(sturgesBins(80)).toBeGreaterThanOrEqual(3);
    expect(sturgesBins(80)).toBeLessThanOrEqual(12);
  });
});
