import { describe, expect, test } from "bun:test";
import {
  coefficientOfVariation,
  describe as describeData,
  mean,
  median,
  modes,
  quantileType7,
  stdDevSample,
  varianceSample,
} from "../stats/descriptive";

describe("estadística descriptiva", () => {
  const values = [1, 2, 3, 4, 5];

  test("calcula media, mediana y cuartiles", () => {
    expect(mean(values)).toBe(3);
    expect(median(values)).toBe(3);
    expect(quantileType7(values, 0.25)).toBe(2);
    expect(quantileType7(values, 0.75)).toBe(4);
    expect(quantileType7(values, 0.1)).toBeCloseTo(1.4, 10);
    expect(quantileType7(values, 0.9)).toBeCloseTo(4.6, 10);
  });

  test("calcula varianza y desviación muestral", () => {
    expect(varianceSample(values)).toBe(2.5);
    expect(stdDevSample(values)).toBeCloseTo(Math.sqrt(2.5), 10);
    expect(coefficientOfVariation(values)).toBeCloseTo((Math.sqrt(2.5) / 3) * 100, 10);
  });

  test("encuentra modas y reporta ausencia de moda única", () => {
    expect(modes([1, 2, 2, 3, 3])).toEqual([2, 3]);
    expect(modes([1, 2, 3])).toEqual([]);
  });

  test("resume un conjunto con cinco números", () => {
    const summary = describeData(values);
    expect(summary.n).toBe(5);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(5);
    expect(summary.range).toBe(4);
    expect(summary.q1).toBe(2);
    expect(summary.q3).toBe(4);
    expect(summary.iqr).toBe(2);
  });

  test("maneja muestras vacías y valores no finitos", () => {
    expect(mean([])).toBeNull();
    expect(median([null, undefined, Number.NaN])).toBeNull();
    expect(varianceSample([1])).toBeNull();
    expect(varianceSample([1, null, 2])).toBe(0.5);
    expect(describeData([]).n).toBe(0);
  });
});
