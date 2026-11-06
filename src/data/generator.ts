import {
  ACADEMIC_YEARS,
  DEFAULT_SEED,
  DEVICES,
  DISTRACTION_LEVELS,
  MAJORS,
  PERCEIVED_IMPACTS,
  SEXES,
  TECH_FREQUENCIES,
  type AcademicYear,
  type Device,
  type DistractionLevel,
  type Major,
  type PerceivedImpact,
  type Sample,
  type Sex,
  type StudentRecord,
  type TechFrequency,
} from "./types";

interface Rng {
  next: () => number;
  normal: () => number;
  integer: (min: number, max: number) => number;
  weighted: <T>(items: readonly T[], weights: readonly number[]) => T;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed: number): Rng {
  const next = mulberry32(seed);

  const normal = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const integer = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;

  const weighted = <T>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let target = next() * total;
    for (let index = 0; index < items.length; index += 1) {
      target -= weights[index] ?? 0;
      if (target <= 0) return items[index] as T;
    }
    return items[items.length - 1] as T;
  };

  return { next, normal, integer, weighted };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: readonly number[]): number {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function zScores(values: readonly number[]): number[] {
  const average = mean(values);
  const deviation = standardDeviation(values);
  if (deviation === 0) return values.map(() => 0);
  return values.map((value) => (value - average) / deviation);
}

function assignByQuantiles<T extends string>(
  latents: readonly number[],
  categories: readonly T[],
  proportions: readonly number[],
): T[] {
  const sorted = latents
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index);

  const assignments = new Array<T>(latents.length);
  const cuts: number[] = [];
  let cumulative = 0;

  for (let index = 0; index < categories.length - 1; index += 1) {
    cumulative += proportions[index] ?? 0;
    cuts.push(Math.floor(latents.length * cumulative));
  }

  let categoryIndex = 0;
  let cutIndex = 0;
  let rank = 0;

  for (const item of sorted) {
    while (cutIndex < cuts.length && rank >= (cuts[cutIndex] ?? latents.length)) {
      categoryIndex += 1;
      cutIndex += 1;
    }
    assignments[item.index] = categories[categoryIndex] as T;
    rank += 1;
  }

  return assignments;
}

const CAREER_EFFECT: Record<Major, number> = {
  "Ingeniería en Sistemas": 1.2,
  Medicina: 0.8,
  Derecho: -0.8,
  "Administración de Empresas": 0,
  Psicología: 0.2,
};

export function generateSample(n: number, seed: number = DEFAULT_SEED): Sample {
  const size = Math.max(1, Math.floor(n));
  const rng = createRng(seed);

  const draft: Array<{
    id: number;
    age: number;
    sex: Sex;
    major: Major;
    year: AcademicYear;
    screenHours: number;
    studyHours: number;
    socialHours: number;
    device: Device;
    gpa: number;
    sleepHours: number;
  }> = [];

  for (let index = 0; index < size; index += 1) {
    const year = rng.weighted(ACADEMIC_YEARS, [0.24, 0.22, 0.2, 0.18, 0.16]);
    const age = clamp(18 + (year - 1) + rng.integer(0, 2), 18, 30);
    const sex = rng.weighted(SEXES, [0.5, 0.45, 0.05]);
    const major = rng.weighted(MAJORS, [0.3, 0.2, 0.15, 0.2, 0.15]);
    const device = rng.weighted(DEVICES, [0.45, 0.12, 0.08, 0.35]);

    const screenHours = round1(clamp(rng.normal() * 2.2 + 5.5, 1, 12));
    const studyHours = round1(clamp(rng.normal() * 4.5 + 10, 0, 30));
    const socialHours = round1(clamp(rng.normal() * 1.5 + 3, 0, 8));
    const sleepHours = round1(clamp(rng.normal() * 1.1 + 6.8, 4, 10));

    const gpa = round1(
      clamp(
        61.5 +
          0.85 * studyHours +
          1.5 * sleepHours -
          0.7 * screenHours -
          0.5 * socialHours +
          CAREER_EFFECT[major] +
          rng.normal() * 7.5,
        30,
        100,
      ),
    );

    draft.push({ id: index + 1, age, sex, major, year, screenHours, studyHours, socialHours, device, gpa, sleepHours });
  }

  const studyZ = zScores(draft.map((row) => row.studyHours));
  const socialZ = zScores(draft.map((row) => row.socialHours));
  const screenZ = zScores(draft.map((row) => row.screenHours));
  const gpaZ = zScores(draft.map((row) => row.gpa));

  const usageLatent = draft.map(
    (_, index) => 0.35 * (studyZ[index] ?? 0) - 0.2 * (socialZ[index] ?? 0) + rng.normal() * 0.8,
  );
  const distractionLatent = draft.map(
    (_, index) =>
      0.4 * (screenZ[index] ?? 0) +
      0.3 * (socialZ[index] ?? 0) -
      0.2 * (studyZ[index] ?? 0) +
      rng.normal() * 0.8,
  );
  const perceptionLatent = draft.map(
    (_, index) =>
      0.45 * (gpaZ[index] ?? 0) - 0.2 * (distractionLatent[index] ?? 0) + rng.normal() * 0.8,
  );

  const usage = assignByQuantiles(usageLatent, TECH_FREQUENCIES, [0.25, 0.25, 0.25, 0.25]);
  const distraction = assignByQuantiles(distractionLatent, DISTRACTION_LEVELS, [0.25, 0.25, 0.25, 0.25]);
  const perception = assignByQuantiles(perceptionLatent, PERCEIVED_IMPACTS, [0.25, 0.4, 0.35]);

  const rows: StudentRecord[] = draft.map((row, index) => ({
    ...row,
    studyTechFrequency: usage[index] as TechFrequency,
    distraction: distraction[index] as DistractionLevel,
    perceivedImpact: perception[index] as PerceivedImpact,
  }));

  ensurePresence(rows, "sex", SEXES);
  ensurePresence(rows, "major", MAJORS);
  ensurePresence(rows, "device", DEVICES);
  ensurePresence(rows, "year", ACADEMIC_YEARS);

  return {
    rows,
    n: rows.length,
    seed,
    // Fecha fija: la muestra es reproducible y el informe impreso coincide siempre.
    generatedAt: "2026-02-14T00:00:00.000Z",
  };
}

function ensurePresence<K extends "sex" | "major" | "device" | "year">(
  rows: StudentRecord[],
  key: K,
  categories: readonly StudentRecord[K][],
): void {
  for (const category of categories) {
    if (rows.some((row) => row[key] === category)) continue;

    const counts = new Map<StudentRecord[K], number>();
    for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);

    const donor = rows.find((row) => (counts.get(row[key]) ?? 0) > 1);
    if (donor) {
      donor[key] = category;
      if (key === "year") {
        const year = category as number;
        donor.age = Math.min(30, Math.max(donor.age, 18 + (year - 1)));
      }
    }
  }
}
