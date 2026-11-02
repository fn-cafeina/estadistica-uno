import type { CategoricalKey } from "../data/types";

export type ChiPairId = "usage" | "distraction" | "perception";

export interface ChiPair {
  id: ChiPairId;
  label: string;
  shortLabel: string;
  description: string;
  rowKey: CategoricalKey;
  colKey: CategoricalKey;
}

export const CHI_PAIRS: readonly ChiPair[] = [
  {
    id: "usage",
    label: "Uso de tecnología para estudiar y nivel de rendimiento",
    shortLabel: "Uso para estudiar × Rendimiento",
    description:
      "Cruza la frecuencia con que se usa la tecnología para estudiar con el nivel de rendimiento derivado del promedio.",
    rowKey: "studyTechFrequency",
    colKey: "performanceLevel",
  },
  {
    id: "distraction",
    label: "Distracción con pantallas y nivel de rendimiento",
    shortLabel: "Distracción × Rendimiento",
    description:
      "Cruza la frecuencia de distracción con pantallas con el nivel de rendimiento derivado del promedio.",
    rowKey: "distraction",
    colKey: "performanceLevel",
  },
  {
    id: "perception",
    label: "Percepción del impacto tecnológico y nivel de rendimiento",
    shortLabel: "Percepción × Rendimiento",
    description:
      "Cruza la percepción del impacto de la tecnología con el nivel de rendimiento derivado del promedio.",
    rowKey: "perceivedImpact",
    colKey: "performanceLevel",
  },
];

export function getChiPair(id: ChiPairId): ChiPair {
  return CHI_PAIRS.find((pair) => pair.id === id) ?? CHI_PAIRS[0]!;
}
