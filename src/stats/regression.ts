import { tTwoSidedPValue } from "./distributions";
import type { NumericValue } from "./descriptive";

export interface RegressionPoint {
  x: number;
  y: number;
  predicted: number;
  residual: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r: number;
  r2: number;
  n: number;
  sse: number;
  sst: number;
  standardError: number | null;
  slopeStandardError: number | null;
  tSlope: number | null;
  pSlope: number | null;
  meanX: number;
  meanY: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: RegressionPoint[];
}

export function linearRegression(x: readonly NumericValue[], y: readonly NumericValue[]): RegressionResult | null {
  const rawPoints: Array<{ x: number; y: number }> = [];

  for (let index = 0; index < Math.min(x.length, y.length); index += 1) {
    const xValue = x[index];
    const yValue = y[index];
    if (
      typeof xValue === "number" &&
      typeof yValue === "number" &&
      Number.isFinite(xValue) &&
      Number.isFinite(yValue)
    ) {
      rawPoints.push({ x: xValue, y: yValue });
    }
  }

  if (rawPoints.length < 3) return null;

  const meanX = rawPoints.reduce((sum, point) => sum + point.x, 0) / rawPoints.length;
  const meanY = rawPoints.reduce((sum, point) => sum + point.y, 0) / rawPoints.length;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;

  for (const point of rawPoints) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  if (sxx === 0 || syy === 0) return null;

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const points = rawPoints.map((point) => {
    const predicted = intercept + slope * point.x;
    return { ...point, predicted, residual: point.y - predicted };
  });

  const sse = points.reduce((sum, point) => sum + point.residual ** 2, 0);
  const sst = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const r2 = Math.min(1, Math.max(0, 1 - sse / sst));
  const r = slope >= 0 ? Math.sqrt(r2) : -Math.sqrt(r2);
  const standardError = points.length > 2 ? Math.sqrt(sse / (points.length - 2)) : null;
  const slopeStandardError = standardError !== null && sxx > 0 ? standardError / Math.sqrt(sxx) : null;
  const tSlope =
    slopeStandardError !== null && slopeStandardError > 0 ? slope / slopeStandardError : slope === 0 ? 0 : null;
  const pSlope =
    tSlope !== null && Number.isFinite(tSlope) ? tTwoSidedPValue(tSlope, points.length - 2) : null;

  return {
    slope,
    intercept,
    r,
    r2,
    n: points.length,
    sse,
    sst,
    standardError,
    slopeStandardError,
    tSlope,
    pSlope,
    meanX,
    meanY,
    xMin: Math.min(...rawPoints.map((point) => point.x)),
    xMax: Math.max(...rawPoints.map((point) => point.x)),
    yMin: Math.min(...rawPoints.map((point) => point.y)),
    yMax: Math.max(...rawPoints.map((point) => point.y)),
    points,
  };
}

export function predictValue(regression: Pick<RegressionResult, "slope" | "intercept">, x: number): number {
  return regression.intercept + regression.slope * x;
}
