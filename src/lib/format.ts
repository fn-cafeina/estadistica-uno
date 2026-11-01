const LOCALE = "es-NI";

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${formatNumber(value, digits)}%`;
}

export function formatPValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value < 0.001) return "< 0.001";
  return formatNumber(value, 3);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatUnit(value: number | null | undefined, unit: string | null, digits = 1): string {
  const formatted = formatNumber(value, digits);
  return unit && formatted !== "—" ? `${formatted} ${unit}` : formatted;
}

export function formatInterval(lower: number, upper: number, digits = 1): string {
  return `${formatNumber(lower, digits)} a ${formatNumber(upper, digits)}`;
}

export function formatSigned(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const formatted = formatNumber(value, digits);
  return value > 0 ? `+${formatted}` : formatted;
}

export function formatEquation(slope: number, intercept: number, xLabel: string, yLabel: string): string {
  const sign = intercept >= 0 ? "+" : "−";
  return `${yLabel} = ${formatNumber(intercept, 2)} ${sign} ${formatNumber(Math.abs(slope), 3)} · ${xLabel}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pDecision(pValue: number | null | undefined, alpha: number): "rechazar" | "no rechazar" | "indeterminada" {
  if (pValue === null || pValue === undefined || !Number.isFinite(pValue)) return "indeterminada";
  return pValue < alpha ? "rechazar" : "no rechazar";
}

export function pDecisionText(pValue: number | null | undefined, alpha: number): string {
  const decision = pDecision(pValue, alpha);
  if (decision === "indeterminada") return "No se pudo calcular la decisión.";
  return decision === "rechazar"
    ? `Con α = ${formatNumber(alpha, 2)}, se rechaza H₀: hay evidencia de asociación en esta muestra.`
    : `Con α = ${formatNumber(alpha, 2)}, no se rechaza H₀: la muestra no aporta evidencia suficiente de asociación.`;
}

export function correlationText(r: number, strength: string, direction: string): string {
  const absolute = Math.abs(r);
  if (absolute < 0.2) {
    return `La relación es ${strength} y ${direction}. En términos prácticos, la nube de puntos se parece más a una nube sin patrón lineal claro que a una recta.`;
  }
  return `La relación es ${strength} y ${direction}. El signo indica la dirección y el valor absoluto, la cercanía a una línea recta.`;
}

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
