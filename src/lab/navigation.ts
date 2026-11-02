import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  Database,
  FlaskConical,
  Home,
  ListOrdered,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "cuestionario", label: "Cuestionario", icon: ClipboardList },
  { id: "base-datos", label: "Base de datos", icon: Database },
  { id: "frecuencias", label: "Frecuencias", icon: ListOrdered },
  { id: "descriptiva", label: "Descriptiva", icon: Calculator },
  { id: "pruebas", label: "Pruebas", icon: FlaskConical },
  { id: "graficos", label: "Gráficos", icon: BarChart3 },
  { id: "interpretacion", label: "Interpretación", icon: BookOpen },
];

// Las secciones con varios procedimientos se parten en sub-vistas: una pantalla
// por procedimiento, enlazable como #pruebas/pearson.
export const PROCEDURES: Readonly<Record<string, readonly NavItem[]>> = {
  pruebas: [
    { id: "chi2", label: "Chi-cuadrado", icon: FlaskConical },
    { id: "pearson", label: "Correlación", icon: Calculator },
    { id: "regresion", label: "Regresión", icon: TrendingUp },
  ],
  graficos: [
    { id: "barras", label: "Barras", icon: BarChart3 },
    { id: "histograma", label: "Histograma", icon: BarChart3 },
    { id: "circular", label: "Circular", icon: BarChart3 },
    { id: "comparacion", label: "Comparación", icon: BarChart3 },
    { id: "dispersion", label: "Dispersión", icon: TrendingUp },
  ],
};

export function firstProcedure(section: string): string | null {
  return PROCEDURES[section]?.[0]?.id ?? null;
}

export function procedureLabel(section: string, procedure: string | null): string | null {
  if (!procedure) return null;
  return PROCEDURES[section]?.find((item) => item.id === procedure)?.label ?? null;
}

export const GROUP_MEMBERS = [
  "Jasmir Moisés Medina Pérez",
  "Samuel Santiago Salgado Selva",
  "Gonzalo Javier Blanco Cardoza",
  "Franklin Isaac Aguirre Zamora",
];

export const TYPE_LABELS = {
  nominal: "Cualitativa nominal",
  ordinal: "Cualitativa ordinal",
  discrete: "Cuantitativa discreta",
  continuous: "Cuantitativa continua",
} as const;
