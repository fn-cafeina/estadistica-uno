import { tTwoSidedPValue } from "./distributions";
import { validNumbers, type NumericValue } from "./descriptive";

export type CorrelationDirection = "positiva" | "negativa" | "nula";
export type CorrelationStrength = "muy débil" | "débil" | "moderada" | "fuerte" | "muy fuerte";

export interface CorrelationPoint {
  x: number;
  y: number;
}

export interface CorrelationResult {
  r: number;
  r2: number;
  n: number;
  t: number;
  pValue: number;
  direction: CorrelationDirection;
  strength: CorrelationStrength;
  covariance: number;
  meanX: number;
  meanY: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: CorrelationPoint[];
}

export function correlationStrength(r: number): CorrelationStrength {
  const absolute = Math.abs(r);
  if (absolute < 0.2) return "muy débil";
  if (absolute < 0.4) return "débil";
  if (absolute < 0.6) return "moderada";
  if (absolute < 0.8) return "fuerte";
  return "muy fuerte";
}

export function pearsonCorrelation(x: readonly NumericValue[], y: readonly NumericValue[]): CorrelationResult | null {
  const points: CorrelationPoint[] = [];

  for (let index = 0; index < Math.min(x.length, y.length); index += 1) {
    const xValue = x[index];
    const yValue = y[index];
    if (
      typeof xValue === "number" &&
      typeof yValue === "number" &&
      Number.isFinite(xValue) &&
      Number.isFinite(yValue)
    ) {
      points.push({ x: xValue, y: yValue });
    }
  }

  if (points.length < 3) return null;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const meanX = validNumbers(xs).reduce((sum, value) => sum + value, 0) / points.length;
  const meanY = validNumbers(ys).reduce((sum, value) => sum + value, 0) / points.length;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  if (sxx === 0 || syy === 0) return null;

  const rawR = sxy / Math.sqrt(sxx * syy);
  const r = Math.max(-1, Math.min(1, rawR));
  const r2 = r * r;
  const t = Math.abs(r) >= 1 - 1e-12 ? Number.POSITIVE_INFINITY : r * Math.sqrt((points.length - 2) / (1 - r2));
  const pValue = Math.abs(r) >= 1 - 1e-12 ? 0 : tTwoSidedPValue(t, points.length - 2);

  return {
    r,
    r2,
    n: points.length,
    t,
    pValue,
    direction: r > 0 ? "positiva" : r < 0 ? "negativa" : "nula",
    strength: correlationStrength(r),
    covariance: sxy / (points.length - 1),
    meanX,
    meanY,
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(...ys),
    yMax: Math.max(...ys),
    points,
  };
}
