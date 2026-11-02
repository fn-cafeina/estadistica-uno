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
  number: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Home, number: "00" },
  { id: "cuestionario", label: "Cuestionario", icon: ClipboardList, number: "01" },
  { id: "base-datos", label: "Base de datos", icon: Database, number: "02" },
  { id: "frecuencias", label: "Frecuencias", icon: ListOrdered, number: "03" },
  { id: "descriptiva", label: "Descriptiva", icon: Calculator, number: "04" },
  { id: "pruebas", label: "Pruebas", icon: FlaskConical, number: "05" },
  { id: "graficos", label: "Gráficos", icon: BarChart3, number: "06" },
  { id: "interpretacion", label: "Interpretación", icon: BookOpen, number: "07" },
];

// Las secciones con varios procedimientos se parten en sub-vistas: una pantalla
// por procedimiento, enlazable como #pruebas/pearson.
export const PROCEDURES: Readonly<Record<string, readonly NavItem[]>> = {
  pruebas: [
    { id: "chi2", label: "Chi-cuadrado", icon: FlaskConical, number: "05.1" },
    { id: "pearson", label: "Correlación", icon: Calculator, number: "05.2" },
    { id: "regresion", label: "Regresión", icon: TrendingUp, number: "05.3" },
  ],
  graficos: [
    { id: "barras", label: "Barras", icon: BarChart3, number: "06.1" },
    { id: "histograma", label: "Histograma", icon: BarChart3, number: "06.2" },
    { id: "circular", label: "Circular", icon: BarChart3, number: "06.3" },
    { id: "comparacion", label: "Comparación", icon: BarChart3, number: "06.4" },
    { id: "dispersion", label: "Dispersión", icon: TrendingUp, number: "06.5" },
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
