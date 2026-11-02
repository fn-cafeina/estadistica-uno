import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  Database,
  FlaskConical,
  Home,
  ListOrdered,
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
