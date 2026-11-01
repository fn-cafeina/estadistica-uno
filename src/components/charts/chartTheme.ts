export interface ChartTokens {
  text: string;
  muted: string;
  faint: string;
  grid: string;
  border: string;
  surface: string;
  surface2: string;
  accent: string;
  accent2: string;
  success: string;
  warning: string;
  danger: string;
  chart: string[];
}

const FALLBACK_TOKENS: ChartTokens = {
  text: "#cdd6f4",
  muted: "#a6adc8",
  faint: "#7f849c",
  grid: "rgba(205, 214, 244, 0.08)",
  border: "rgba(205, 214, 244, 0.18)",
  surface: "#181825",
  surface2: "#1e1e2e",
  accent: "#89b4fa",
  accent2: "#cba6f7",
  success: "#a6e3a1",
  warning: "#f9e2af",
  danger: "#f38ba8",
  chart: ["#89b4fa", "#cba6f7", "#a6e3a1", "#f9e2af", "#fab387", "#94e2d5"],
};

const PRINT_TOKENS: ChartTokens = {
  text: "#17212b",
  muted: "#4b5563",
  faint: "#667085",
  grid: "rgba(23, 33, 43, 0.14)",
  border: "#b8c2cf",
  surface: "#ffffff",
  surface2: "#f8fafc",
  accent: "#245b70",
  accent2: "#6b9b83",
  success: "#2f6b4f",
  warning: "#8a5a00",
  danger: "#9f1239",
  chart: ["#245b70", "#6b9b83", "#b7791f", "#8f5b9e", "#b45309", "#0f766e"],
};

function readToken(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = style.getPropertyValue(name).trim();
  return value || fallback;
}

export function readChartTokens(printing = false): ChartTokens {
  if (printing) return PRINT_TOKENS;
  if (typeof document === "undefined") return FALLBACK_TOKENS;
  const style = getComputedStyle(document.documentElement);
  return {
    text: readToken(style, "--text", FALLBACK_TOKENS.text),
    muted: readToken(style, "--muted", FALLBACK_TOKENS.muted),
    faint: readToken(style, "--faint", FALLBACK_TOKENS.faint),
    grid: readToken(style, "--grid", FALLBACK_TOKENS.grid),
    border: readToken(style, "--border", FALLBACK_TOKENS.border),
    surface: readToken(style, "--surface", FALLBACK_TOKENS.surface),
    surface2: readToken(style, "--surface-2", FALLBACK_TOKENS.surface2),
    accent: readToken(style, "--accent", FALLBACK_TOKENS.accent),
    accent2: readToken(style, "--accent-2", FALLBACK_TOKENS.accent2),
    success: readToken(style, "--success", FALLBACK_TOKENS.success),
    warning: readToken(style, "--warning", FALLBACK_TOKENS.warning),
    danger: readToken(style, "--danger", FALLBACK_TOKENS.danger),
    chart: [
      readToken(style, "--chart-1", FALLBACK_TOKENS.chart[0]!),
      readToken(style, "--chart-2", FALLBACK_TOKENS.chart[1]!),
      readToken(style, "--chart-3", FALLBACK_TOKENS.chart[2]!),
      readToken(style, "--chart-4", FALLBACK_TOKENS.chart[3]!),
      readToken(style, "--chart-5", FALLBACK_TOKENS.chart[4]!),
      readToken(style, "--chart-6", FALLBACK_TOKENS.chart[5]!),
    ],
  };
}

export function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((character) => character + character)
            .join("")
        : hex;

    if (expanded.length === 6) {
      const red = Number.parseInt(expanded.slice(0, 2), 16);
      const green = Number.parseInt(expanded.slice(2, 4), 16);
      const blue = Number.parseInt(expanded.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  if (normalized.startsWith("rgb(")) {
    return normalized.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  return normalized;
}

export function tooltipStyle(tokens: ChartTokens) {
  return {
    backgroundColor: tokens.surface,
    titleColor: tokens.text,
    bodyColor: tokens.muted,
    borderColor: tokens.border,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    titleFont: { weight: 600 as const },
    bodyFont: { size: 11 },
  };
}
