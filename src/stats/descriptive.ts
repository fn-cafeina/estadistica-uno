export type NumericValue = number | null | undefined;

export interface DescriptiveSummary {
  n: number;
  mean: number | null;
  median: number | null;
  mode: number | null;
  modes: number[];
  min: number | null;
  max: number | null;
  range: number | null;
  variance: number | null;
  stdDev: number | null;
  cv: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  p10: number | null;
  p90: number | null;
  outlierCount: number;
}

export function validNumbers(values: readonly NumericValue[]): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function mean(values: readonly NumericValue[]): number | null {
  const valid = validNumbers(values);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function quantileType7(values: readonly NumericValue[], probability: number): number | null {
  const valid = validNumbers(values).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0] ?? null;

  const p = Math.min(1, Math.max(0, probability));
  const position = (valid.length - 1) * p;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = valid[lowerIndex];
  const upper = valid[upperIndex];

  if (lower === undefined || upper === undefined) return null;
  if (lowerIndex === upperIndex) return lower;

  return lower + (upper - lower) * (position - lowerIndex);
}

export function median(values: readonly NumericValue[]): number | null {
  return quantileType7(values, 0.5);
}

export function modes(values: readonly NumericValue[]): number[] {
  const valid = validNumbers(values);
  if (valid.length === 0) return [];

  const counts = new Map<number, number>();
  for (const value of valid) counts.set(value, (counts.get(value) ?? 0) + 1);

  let maxCount = 0;
  for (const count of counts.values()) maxCount = Math.max(maxCount, count);

  if (maxCount <= 1) return [];

  return [...counts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function varianceSample(values: readonly NumericValue[]): number | null {
  const valid = validNumbers(values);
  if (valid.length < 2) return null;
  const average = mean(valid);
  if (average === null) return null;
  const sumSquared = valid.reduce((sum, value) => sum + (value - average) ** 2, 0);
  return sumSquared / (valid.length - 1);
}

export function stdDevSample(values: readonly NumericValue[]): number | null {
  const variance = varianceSample(values);
  return variance === null ? null : Math.sqrt(variance);
}

export function coefficientOfVariation(values: readonly NumericValue[]): number | null {
  const average = mean(values);
  const deviation = stdDevSample(values);
  if (average === null || deviation === null || average === 0) return null;
  return (deviation / Math.abs(average)) * 100;
}

export function describe(values: readonly NumericValue[]): DescriptiveSummary {
  const valid = validNumbers(values);
  const average = mean(valid);
  const medianValue = median(valid);
  const modeValues = modes(valid);
  const min = valid.length > 0 ? Math.min(...valid) : null;
  const max = valid.length > 0 ? Math.max(...valid) : null;
  const q1 = quantileType7(valid, 0.25);
  const q3 = quantileType7(valid, 0.75);
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
  const lowerFence = q1 !== null && iqr !== null ? q1 - 1.5 * iqr : null;
  const upperFence = q3 !== null && iqr !== null ? q3 + 1.5 * iqr : null;

  return {
    n: valid.length,
    mean: average,
    median: medianValue,
    mode: modeValues[0] ?? null,
    modes: modeValues,
    min,
    max,
    range: min !== null && max !== null ? max - min : null,
    variance: varianceSample(valid),
    stdDev: stdDevSample(valid),
    cv: coefficientOfVariation(valid),
    q1,
    q3,
    iqr,
    p10: quantileType7(valid, 0.1),
    p90: quantileType7(valid, 0.9),
    outlierCount:
      lowerFence !== null && upperFence !== null
        ? valid.filter((value) => value < lowerFence || value > upperFence).length
        : 0,
  };
}
