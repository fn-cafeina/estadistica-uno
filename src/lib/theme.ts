import { DEFAULT_THEME, THEMES, type ThemeId } from "../data/types";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  swatches: readonly string[];
  metaColor: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: "mocha",
    name: "Catppuccin Mocha",
    description: "Cálido, suave y de bajo contraste agresivo.",
    swatches: ["#89b4fa", "#cba6f7", "#a6e3a1", "#f9e2af"],
    metaColor: "#11111b",
  },
  {
    id: "rose-pine",
    name: "Rosé Pine Moon",
    description: "Muted, editorial y con acentos rosados.",
    swatches: ["#c4a7e7", "#ebbcba", "#9ccfd8", "#f6c177"],
    metaColor: "#232136",
  },
  {
    id: "github",
    name: "GitHub Dark",
    description: "Neutro, técnico y de alto contraste.",
    swatches: ["#58a6ff", "#bc8cff", "#3fb950", "#d29922"],
    metaColor: "#0d1117",
  },
  {
    id: "ayu",
    name: "Ayu Dark",
    description: "Oscuro, cálido y con acentos ámbar.",
    swatches: ["#59c2ff", "#e6b450", "#aad94c", "#f29668"],
    metaColor: "#0b0e14",
  },
] as const;

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value !== null && value !== undefined && (THEMES as readonly string[]).includes(value);
}

export function loadStoredTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const fromDom = document.documentElement.dataset.theme;
  if (isThemeId(fromDom)) return fromDom;
  try {
    const stored = localStorage.getItem("estadistica-theme");
    if (isThemeId(stored)) return stored;
  } catch {
    // localStorage puede no estar disponible
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  const option = THEME_OPTIONS.find((item) => item.id === theme);
  if (meta && option) meta.setAttribute("content", option.metaColor);
  try {
    localStorage.setItem("estadistica-theme", theme);
  } catch {
    // La aplicación funciona aunque no se pueda persistir el tema
  }
}

export function getThemeOption(theme: ThemeId): ThemeOption {
  return THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0]!;
}
