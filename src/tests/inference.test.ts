import { describe, expect, test } from "bun:test";
import { chiSquarePValue, regularizedBeta, regularizedGammaQ, tTwoSidedPValue } from "../stats/distributions";
import { chiSquareTest } from "../stats/chiSquare";
import { correlationStrength, pearsonCorrelation } from "../stats/correlation";
import { linearRegression, predictValue } from "../stats/regression";

const ANSCOMBE_X = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
const ANSCOMBE_Y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];

describe("distribuciones de probabilidad", () => {
  test("aproxima valores críticos de chi-cuadrado", () => {
    expect(chiSquarePValue(3.841, 1)).toBeCloseTo(0.05, 2);
    expect(chiSquarePValue(5.991, 2)).toBeCloseTo(0.05, 2);
    expect(chiSquarePValue(9.488, 4)).toBeCloseTo(0.05, 2);
    expect(chiSquarePValue(0, 3)).toBe(1);
  });

  test("aproxima valores críticos de t bilateral", () => {
    expect(tTwoSidedPValue(2.228, 10)).toBeCloseTo(0.05, 2);
    expect(tTwoSidedPValue(0, 10)).toBe(1);
    expect(tTwoSidedPValue(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });

  test("mantiene probabilidades dentro de [0, 1]", () => {
    expect(regularizedGammaQ(2, 5)).toBeGreaterThanOrEqual(0);
    expect(regularizedGammaQ(2, 5)).toBeLessThanOrEqual(1);
    expect(regularizedBeta(2, 3, 0.4)).toBeGreaterThanOrEqual(0);
    expect(regularizedBeta(2, 3, 0.4)).toBeLessThanOrEqual(1);
  });
});

describe("chi-cuadrado", () => {
  test("calcula una tabla 2x2 con esperados conocidos", () => {
    const pairs = [
      ...Array.from({ length: 10 }, () => ({ row: "A", col: "X" })),
      ...Array.from({ length: 20 }, () => ({ row: "A", col: "Y" })),
      ...Array.from({ length: 20 }, () => ({ row: "B", col: "X" })),
      ...Array.from({ length: 10 }, () => ({ row: "B", col: "Y" })),
    ];

    const result = chiSquareTest(pairs, ["A", "B"], ["X", "Y"]);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(60);
    expect(result?.observed).toEqual([
      [10, 20],
      [20, 10],
    ]);
    expect(result?.expected).toEqual([
      [15, 15],
      [15, 15],
    ]);
    expect(result?.statistic).toBeCloseTo(100 / 15, 10);
    expect(result?.degreesOfFreedom).toBe(1);
    expect(result?.pValue).toBeCloseTo(0.00982, 3);
    expect(result?.cellsBelow5).toBe(0);
  });

  test("omite categorías vacías y detecta esperados pequeños", () => {
    const pairs = [
      ...Array.from({ length: 30 }, () => ({ row: "A", col: "X" })),
      ...Array.from({ length: 1 }, () => ({ row: "A", col: "Y" })),
      ...Array.from({ length: 1 }, () => ({ row: "B", col: "Y" })),
    ];
    const result = chiSquareTest(pairs, ["A", "B"], ["X", "Y", "Z"]);
    expect(result).not.toBeNull();
    expect(result?.colCategories).toEqual(["X", "Y"]);
    expect(result?.omittedColCategories).toEqual(["Z"]);
    expect(result?.cellsBelow5).toBeGreaterThan(0);
  });

  test("devuelve null cuando no hay dos categorías por dimensión", () => {
    expect(chiSquareTest([])).toBeNull();
    expect(chiSquareTest([{ row: "A", col: "X" }])).toBeNull();
  });
});

describe("correlación de Pearson", () => {
  test("reproduce el cuarteto de Anscombe I", () => {
    const result = pearsonCorrelation(ANSCOMBE_X, ANSCOMBE_Y);
    expect(result).not.toBeNull();
    expect(result?.r).toBeCloseTo(0.8164, 3);
    expect(result?.r2).toBeCloseTo(0.6665, 3);
    expect(result?.n).toBe(11);
    expect(result?.direction).toBe("positiva");
    expect(result?.strength).toBe("muy fuerte");
    expect(result?.pValue).toBeLessThan(0.01);
  });

  test("clasifica la intensidad y maneja casos límite", () => {
    expect(correlationStrength(0.1)).toBe("muy débil");
    expect(correlationStrength(-0.5)).toBe("moderada");
    expect(correlationStrength(0.9)).toBe("muy fuerte");
    expect(pearsonCorrelation([1, 2], [2, 4])).toBeNull();
    expect(pearsonCorrelation([1, 1, 1], [1, 2, 3])).toBeNull();
    expect(pearsonCorrelation([1, null, 3], [1, 2, 3])).toBeNull();
  });
});

describe("regresión lineal simple", () => {
  test("reproduce pendiente, intercepto y R² de Anscombe I", () => {
    const result = linearRegression(ANSCOMBE_X, ANSCOMBE_Y);
    expect(result).not.toBeNull();
    expect(result?.slope).toBeCloseTo(0.5001, 3);
    expect(result?.intercept).toBeCloseTo(3.0001, 3);
    expect(result?.r2).toBeCloseTo(0.6665, 3);
    expect(result?.n).toBe(11);
    expect(result?.standardError).toBeGreaterThan(0);
    expect(result?.points).toHaveLength(11);
  });

  test("predice dentro del rango y maneja casos límite", () => {
    const result = linearRegression([0, 1, 2, 3], [1, 3, 5, 7]);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(1, 10);
    expect(result.r2).toBeCloseTo(1, 10);
    expect(predictValue(result, 4)).toBeCloseTo(9, 10);
    expect(linearRegression([1, 2], [1, 2])).toBeNull();
    expect(linearRegression([1, 1, 1], [1, 2, 3])).toBeNull();
    expect(linearRegression([1, 2, 3], [5, 5, 5])).toBeNull();
  });
});
