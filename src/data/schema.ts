import {
  ACADEMIC_YEARS,
  DEVICES,
  DISTRACTION_LEVELS,
  MAJORS,
  PERCEIVED_IMPACTS,
  PERFORMANCE_LEVELS,
  SEXES,
  TECH_FREQUENCIES,
  type CategoricalKey,
  type PerformanceLevel,
  type QualitativeKey,
  type QuantitativeKey,
  type StudentRecord,
  type VariableKey,
} from "./types";

export type VariableType = "nominal" | "ordinal" | "discrete" | "continuous";
export type VariableRole = "context" | "predictor" | "outcome" | "control";

export interface VariableDefinition {
  key: VariableKey;
  number: number;
  label: string;
  shortLabel: string;
  question: string;
  type: VariableType;
  role: VariableRole;
  unit: string | null;
  min: number | null;
  max: number | null;
  step: number | null;
  categories: readonly string[] | null;
  coding: string;
  description: string;
}

export interface CategoricalVariableMeta {
  key: CategoricalKey;
  label: string;
  shortLabel: string;
  categories: readonly string[];
  ordinal: boolean;
  derived: boolean;
}

export const ACADEMIC_YEAR_LABELS = ACADEMIC_YEARS.map((year) => `${year}.º`);

export const VARIABLES: readonly VariableDefinition[] = [
  {
    key: "age",
    number: 1,
    label: "Edad",
    shortLabel: "Edad",
    question: "¿Cuál es tu edad?",
    type: "discrete",
    role: "context",
    unit: "años",
    min: 18,
    max: 30,
    step: 1,
    categories: null,
    coding: "Años cumplidos, de 18 a 30.",
    description: "Edad declarada por la persona encuestada.",
  },
  {
    key: "sex",
    number: 2,
    label: "Sexo",
    shortLabel: "Sexo",
    question: "¿Con qué sexo te identificas?",
    type: "nominal",
    role: "context",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: SEXES,
    coding: "1 = Femenino; 2 = Masculino; 3 = Otro/prefiero no decir.",
    description: "Variable de contexto, sin orden entre categorías.",
  },
  {
    key: "major",
    number: 3,
    label: "Carrera",
    shortLabel: "Carrera",
    question: "¿Qué carrera cursas?",
    type: "nominal",
    role: "context",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: MAJORS,
    coding: "1 = Ingeniería en Sistemas; 2 = Medicina; 3 = Derecho; 4 = Administración de Empresas; 5 = Psicología.",
    description: "Carrera universitaria en curso.",
  },
  {
    key: "year",
    number: 4,
    label: "Año académico",
    shortLabel: "Año",
    question: "¿En qué año académico estás?",
    type: "ordinal",
    role: "context",
    unit: null,
    min: 1,
    max: 5,
    step: 1,
    categories: ACADEMIC_YEAR_LABELS,
    coding: "1 = 1.º año; 2 = 2.º; 3 = 3.º; 4 = 4.º; 5 = 5.º.",
    description: "Año de avance en la carrera; tiene orden natural.",
  },
  {
    key: "screenHours",
    number: 5,
    label: "Horas de pantalla al día",
    shortLabel: "Pantalla",
    question: "¿Cuántas horas al día pasas frente a pantallas fuera del horario de clase?",
    type: "continuous",
    role: "predictor",
    unit: "h/día",
    min: 1,
    max: 12,
    step: 0.1,
    categories: null,
    coding: "Horas decimales por día, de 1.0 a 12.0.",
    description: "Tiempo total frente a pantallas fuera de clases.",
  },
  {
    key: "studyHours",
    number: 6,
    label: "Horas de estudio semanal",
    shortLabel: "Estudio",
    question: "¿Cuántas horas a la semana dedicas al estudio independiente?",
    type: "continuous",
    role: "predictor",
    unit: "h/semana",
    min: 0,
    max: 30,
    step: 0.1,
    categories: null,
    coding: "Horas decimales por semana, de 0.0 a 30.0.",
    description: "Tiempo semanal dedicado a estudiar fuera de clase.",
  },
  {
    key: "socialHours",
    number: 7,
    label: "Horas de redes sociales al día",
    shortLabel: "Redes",
    question: "¿Cuántas horas al día usas redes sociales?",
    type: "continuous",
    role: "predictor",
    unit: "h/día",
    min: 0,
    max: 8,
    step: 0.1,
    categories: null,
    coding: "Horas decimales por día, de 0.0 a 8.0.",
    description: "Tiempo diario dedicado a redes sociales.",
  },
  {
    key: "studyTechFrequency",
    number: 8,
    label: "Uso de tecnología para estudiar",
    shortLabel: "Uso para estudiar",
    question: "¿Con qué frecuencia usas la tecnología como apoyo para estudiar?",
    type: "ordinal",
    role: "predictor",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: TECH_FREQUENCIES,
    coding: "1 = Nunca o rara vez; 2 = A veces; 3 = Frecuentemente; 4 = Siempre.",
    description: "Frecuencia declarada de uso de tecnología para tareas académicas.",
  },
  {
    key: "device",
    number: 9,
    label: "Dispositivo principal",
    shortLabel: "Dispositivo",
    question: "¿Cuál es tu dispositivo principal para estudiar?",
    type: "nominal",
    role: "context",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: DEVICES,
    coding: "1 = Laptop; 2 = Computadora de escritorio; 3 = Tablet; 4 = Celular.",
    description: "Equipo que se usa con mayor frecuencia para estudiar.",
  },
  {
    key: "distraction",
    number: 10,
    label: "Distracción con pantallas",
    shortLabel: "Distracción",
    question: "¿Con qué frecuencia te distraes con el celular u otras pantallas mientras estudias o estás en clase?",
    type: "ordinal",
    role: "predictor",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: DISTRACTION_LEVELS,
    coding: "1 = Nunca o rara vez; 2 = A veces; 3 = Frecuentemente; 4 = Siempre.",
    description: "Frecuencia de distracción atribuida a pantallas.",
  },
  {
    key: "perceivedImpact",
    number: 11,
    label: "Percepción del impacto",
    shortLabel: "Percepción",
    question: "¿Cómo percibes el impacto de la tecnología en tu rendimiento académico?",
    type: "ordinal",
    role: "context",
    unit: null,
    min: null,
    max: null,
    step: null,
    categories: PERCEIVED_IMPACTS,
    coding: "1 = Negativo; 2 = Neutro; 3 = Positivo.",
    description: "Valoración subjetiva, no una medición objetiva del rendimiento.",
  },
  {
    key: "gpa",
    number: 12,
    label: "Promedio académico",
    shortLabel: "Promedio",
    question: "¿Cuál fue tu promedio académico del último semestre?",
    type: "continuous",
    role: "outcome",
    unit: "puntos",
    min: 0,
    max: 100,
    step: 0.1,
    categories: null,
    coding: "Puntos de 0.0 a 100.0, con un decimal.",
    description: "Promedio autodeclarado del último semestre, en escala de 0 a 100.",
  },
  {
    key: "sleepHours",
    number: 13,
    label: "Horas de sueño por noche",
    shortLabel: "Sueño",
    question: "¿Cuántas horas duermes en promedio por noche?",
    type: "continuous",
    role: "control",
    unit: "h/noche",
    min: 4,
    max: 10,
    step: 0.1,
    categories: null,
    coding: "Horas decimales por noche, de 4.0 a 10.0.",
    description: "Variable de control incluida porque también se asocia con el rendimiento.",
  },
] as const;

export const VARIABLE_MAP = Object.fromEntries(VARIABLES.map((variable) => [variable.key, variable])) as Record<
  VariableKey,
  VariableDefinition
>;

export const QUESTIONNAIRE = [...VARIABLES].sort((a, b) => a.number - b.number);

export const QUALITATIVE_VARIABLES = VARIABLES.filter(
  (variable) => variable.type === "nominal" || variable.type === "ordinal",
);

export const QUANTITATIVE_VARIABLES = VARIABLES.filter(
  (variable) => variable.type === "continuous" || variable.type === "discrete",
);

export const QUANTITATIVE_KEYS = QUANTITATIVE_VARIABLES.map((variable) => variable.key) as QuantitativeKey[];
export const QUALITATIVE_KEYS = QUALITATIVE_VARIABLES.map((variable) => variable.key) as QualitativeKey[];

export const PERFORMANCE_VARIABLE: CategoricalVariableMeta = {
  key: "performanceLevel",
  label: "Nivel de rendimiento",
  shortLabel: "Nivel de rendimiento",
  categories: PERFORMANCE_LEVELS,
  ordinal: true,
  derived: true,
};

export const CATEGORICAL_VARIABLES: readonly CategoricalVariableMeta[] = [
  ...QUALITATIVE_VARIABLES.map((variable) => ({
    key: variable.key as CategoricalKey,
    label: variable.label,
    shortLabel: variable.shortLabel,
    categories: variable.categories ?? [],
    ordinal: variable.type === "ordinal",
    derived: false,
  })),
  PERFORMANCE_VARIABLE,
];

export const CATEGORICAL_MAP = Object.fromEntries(
  CATEGORICAL_VARIABLES.map((variable) => [variable.key, variable]),
) as Record<CategoricalKey, CategoricalVariableMeta>;

export function performanceLevel(gpa: number): PerformanceLevel {
  if (gpa < 70) return "Bajo";
  if (gpa < 80) return "Medio";
  return "Alto";
}

export function isQuantitativeKey(key: string): key is QuantitativeKey {
  return (QUANTITATIVE_KEYS as string[]).includes(key);
}

export function isQualitativeKey(key: string): key is QualitativeKey {
  return (QUALITATIVE_KEYS as string[]).includes(key);
}

export function isCategoricalKey(key: string): key is CategoricalKey {
  return key === "performanceLevel" || isQualitativeKey(key);
}

export function getCategoricalValue(record: StudentRecord, key: CategoricalKey): string {
  if (key === "performanceLevel") return performanceLevel(record.gpa);
  if (key === "year") return `${record.year}.º`;
  return String(record[key]);
}

export function getCategories(key: CategoricalKey): readonly string[] {
  return CATEGORICAL_MAP[key].categories;
}

export function getVariableMeta(key: VariableKey) {
  return VARIABLE_MAP[key];
}

export function getVariableLabel(key: VariableKey | CategoricalKey): string {
  if (key === "performanceLevel") return PERFORMANCE_VARIABLE.label;
  return VARIABLE_MAP[key as VariableKey].label;
}

export function getVariableUnit(key: VariableKey | CategoricalKey): string | null {
  if (key === "performanceLevel") return null;
  return VARIABLE_MAP[key as VariableKey].unit;
}

export function getVariableShortLabel(key: VariableKey | CategoricalKey): string {
  if (key === "performanceLevel") return PERFORMANCE_VARIABLE.shortLabel;
  return VARIABLE_MAP[key as VariableKey].shortLabel;
}

export function formatCategoricalValue(key: CategoricalKey, value: string): string {
  if (key === "year") {
    const year = Number.parseInt(value, 10);
    return Number.isFinite(year) ? `${year}.º` : value;
  }
  return value;
}

export function recordCategory(record: StudentRecord, key: CategoricalKey): string {
  return getCategoricalValue(record, key);
}
