import type { CategoricalKey, QualitativeKey, QuantitativeKey } from "./types";

export type ChiPairId = "usage" | "distraction" | "perception";

export interface ChiPairOption {
  id: ChiPairId;
  label: string;
  shortLabel: string;
  rowKey: CategoricalKey;
  colKey: CategoricalKey;
  description: string;
}

export const CHI_PAIRS: readonly ChiPairOption[] = [
  {
    id: "usage",
    label: "Uso de tecnología para estudiar vs nivel de rendimiento",
    shortLabel: "Uso vs rendimiento",
    rowKey: "studyTechFrequency",
    colKey: "performanceLevel",
    description:
      "Compara la frecuencia declarada de uso de tecnología para estudiar con el nivel de rendimiento derivado del promedio.",
  },
  {
    id: "distraction",
    label: "Distracción con pantallas vs nivel de rendimiento",
    shortLabel: "Distracción vs rendimiento",
    rowKey: "distraction",
    colKey: "performanceLevel",
    description:
      "Compara la frecuencia de distracción con pantallas con el nivel de rendimiento derivado del promedio.",
  },
  {
    id: "perception",
    label: "Percepción del impacto vs nivel de rendimiento",
    shortLabel: "Percepción vs rendimiento",
    rowKey: "perceivedImpact",
    colKey: "performanceLevel",
    description:
      "Compara la percepción subjetiva del impacto tecnológico con el nivel de rendimiento. No mide causalidad.",
  },
] as const;

export function getChiPair(id: ChiPairId): ChiPairOption {
  return CHI_PAIRS.find((pair) => pair.id === id) ?? CHI_PAIRS[0]!;
}

export const DEFAULT_CHI_PAIR: ChiPairId = "usage";

export const COMPARISON_VARIABLES: readonly QualitativeKey[] = [
  "studyTechFrequency",
  "distraction",
  "major",
  "device",
  "sex",
];

export const BAR_VARIABLES: readonly QualitativeKey[] = [
  "major",
  "sex",
  "year",
  "studyTechFrequency",
  "device",
  "distraction",
  "perceivedImpact",
];

export const PIE_VARIABLES: readonly QualitativeKey[] = [
  "device",
  "major",
  "sex",
  "studyTechFrequency",
  "distraction",
  "perceivedImpact",
];

export const DEFAULT_BAR_VARIABLE: QualitativeKey = "major";
export const DEFAULT_PIE_VARIABLE: QualitativeKey = "device";
export const DEFAULT_COMPARISON_VARIABLE: QualitativeKey = "studyTechFrequency";
export const DEFAULT_CORRELATION_X: QuantitativeKey = "studyHours";
export const DEFAULT_CORRELATION_Y: QuantitativeKey = "gpa";
export const DEFAULT_REGRESSION_X: QuantitativeKey = "studyHours";
export const DEFAULT_REGRESSION_Y: QuantitativeKey = "gpa";
