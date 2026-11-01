export const SEXES = ["Femenino", "Masculino", "Otro/prefiero no decir"] as const;
export type Sex = (typeof SEXES)[number];

export const MAJORS = [
  "Ingeniería en Sistemas",
  "Medicina",
  "Derecho",
  "Administración de Empresas",
  "Psicología",
] as const;
export type Major = (typeof MAJORS)[number];

export const TECH_FREQUENCIES = ["Nunca o rara vez", "A veces", "Frecuentemente", "Siempre"] as const;
export type TechFrequency = (typeof TECH_FREQUENCIES)[number];

export const DEVICES = ["Laptop", "Computadora de escritorio", "Tablet", "Celular"] as const;
export type Device = (typeof DEVICES)[number];

export const DISTRACTION_LEVELS = ["Nunca o rara vez", "A veces", "Frecuentemente", "Siempre"] as const;
export type DistractionLevel = (typeof DISTRACTION_LEVELS)[number];

export const PERCEIVED_IMPACTS = ["Negativo", "Neutro", "Positivo"] as const;
export type PerceivedImpact = (typeof PERCEIVED_IMPACTS)[number];

export const PERFORMANCE_LEVELS = ["Bajo", "Medio", "Alto"] as const;
export type PerformanceLevel = (typeof PERFORMANCE_LEVELS)[number];

export const ACADEMIC_YEARS = [1, 2, 3, 4, 5] as const;
export type AcademicYear = (typeof ACADEMIC_YEARS)[number];

export interface StudentRecord {
  id: number;
  age: number;
  sex: Sex;
  major: Major;
  year: AcademicYear;
  screenHours: number;
  studyHours: number;
  socialHours: number;
  studyTechFrequency: TechFrequency;
  device: Device;
  distraction: DistractionLevel;
  perceivedImpact: PerceivedImpact;
  gpa: number;
  sleepHours: number;
}

export type VariableKey = Exclude<keyof StudentRecord, "id">;
export type QuantitativeKey = "age" | "screenHours" | "studyHours" | "socialHours" | "gpa" | "sleepHours";
export type QualitativeKey =
  | "sex"
  | "major"
  | "year"
  | "studyTechFrequency"
  | "device"
  | "distraction"
  | "perceivedImpact";
export type CategoricalKey = QualitativeKey | "performanceLevel";

export interface Sample {
  rows: StudentRecord[];
  n: number;
  seed: number;
  generatedAt: string;
}

export const DEFAULT_SAMPLE_SIZE = 80;
export const DEFAULT_SEED = 20260214;

