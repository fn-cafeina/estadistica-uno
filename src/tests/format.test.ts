import { describe, expect, test } from "bun:test";
import { formatEquation, formatNumber } from "../lib/format";

// El separador decimal depende del runtime (coma en el navegador, punto en
// algunos Node), así que los test comparan con formatNumber, no con literales.
function expectEquation(slope: number, intercept: number, xLabel: string, yLabel: string, operator: "+" | "−") {
  const expected = `${yLabel} = ${formatNumber(intercept, 2)} ${operator} ${formatNumber(Math.abs(slope), 3)} · ${xLabel}`;
  expect(formatEquation(slope, intercept, xLabel, yLabel)).toBe(expected);
}

describe("formatEquation", () => {
  test("pendiente negativa con intercepto positivo resta", () => {
    expectEquation(-1.154, 81.29, "pantalla", "Promedio", "−");
  });

  test("pendiente positiva suma", () => {
    expectEquation(0.283, 41.6, "estudio", "Promedio", "+");
  });

  test("intercepto negativo conserva su signo y la pendiente se suma", () => {
    expectEquation(0.283, -11.75, "estudio", "Promedio", "+");
    expect(formatEquation(0.283, -11.75, "estudio", "Promedio")).toContain(formatNumber(-11.75, 2));
  });

  test("intercepto negativo con pendiente negativa", () => {
    expectEquation(-0.148, -2.5, "edad", "Pantalla", "−");
  });
});
