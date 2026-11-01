import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  Database,
  FlaskConical,
  Home,
  ListOrdered,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "inicio", label: "Inicio", shortLabel: "Inicio", icon: Home },
  { id: "cuestionario", label: "Cuestionario", shortLabel: "Cuestionario", icon: ClipboardList },
  { id: "base-datos", label: "Base de datos", shortLabel: "Base", icon: Database },
  { id: "frecuencias", label: "Distribuciones", shortLabel: "Frecuencias", icon: ListOrdered },
  { id: "descriptiva", label: "Estadística descriptiva", shortLabel: "Descriptiva", icon: Calculator },
  { id: "pruebas", label: "Pruebas estadísticas", shortLabel: "Pruebas", icon: FlaskConical },
  { id: "graficos", label: "Gráficos", shortLabel: "Gráficos", icon: BarChart3 },
  { id: "interpretacion", label: "Interpretación", shortLabel: "Interpretación", icon: BookOpen },
];
