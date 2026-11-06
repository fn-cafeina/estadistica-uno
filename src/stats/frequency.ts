import { validNumbers, type NumericValue } from "./descriptive";

export interface FrequencyRow {
  value: string;
  count: number;
  relative: number;
  percent: number;
  cumulative: number;
  cumulativePercent: number;
}

export interface CategoricalFrequencyResult {
  rows: FrequencyRow[];
  total: number;
}

export interface GroupedFrequencyRow {
  lower: number;
  upper: number;
  mark: number;
  count: number;
  relative: number;
  percent: number;
  cumulative: number;
  cumulativePercent: number;
}

export interface GroupedFrequencyResult {
  rows: GroupedFrequencyRow[];
  total: number;
  min: number | null;
  max: number | null;
  range: number | null;
  k: number;
  width: number;
  constant: boolean;
}

export function categoricalFrequency(
  values: readonly string[],
  options: { order?: readonly string[]; includeZero?: boolean } = {},
): CategoricalFrequencyResult {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const order = options.order ? [...options.order] : [];
  const extras = [...counts.keys()].filter((value) => !order.includes(value));
  const categories = [...order, ...extras];

  if (options.includeZero && options.order) {
    for (const category of options.order) {
      if (!counts.has(category)) counts.set(category, 0);
    }
  }

  const total = values.length;
  let cumulative = 0;

  const rows = categories.map((value) => {
    const count = counts.get(value) ?? 0;
    cumulative += count;
    const relative = total > 0 ? count / total : 0;
    return {
      value,
      count,
      relative,
      percent: relative * 100,
      cumulative,
      cumulativePercent: total > 0 ? (cumulative / total) * 100 : 0,
    };
  });

  return { rows, total };
}

export function sturgesBins(n: number): number {
  if (n <= 0) return 1;
  return Math.min(12, Math.max(3, Math.ceil(1 + 3.322 * Math.log10(n))));
}

export function groupedFrequency(values: readonly NumericValue[], requestedBins?: number): GroupedFrequencyResult {
  const valid = validNumbers(values);
  const total = valid.length;

  if (total === 0) {
    return { rows: [], total: 0, min: null, max: null, range: null, k: 0, width: 0, constant: false };
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;

  if (range === 0) {
    return {
      rows: [
        {
          lower: min,
          upper: max,
          mark: min,
          count: total,
          relative: 1,
          percent: 100,
          cumulative: total,
          cumulativePercent: 100,
        },
      ],
      total,
      min,
      max,
      range,
      k: 1,
      width: 0,
      constant: true,
    };
  }

  const requested = Number.isFinite(requestedBins) ? Math.round(requestedBins as number) : sturgesBins(total);
  const k = Math.min(Math.max(3, requested), 12, Math.max(1, total));
  const width = range / k;
  const rows: GroupedFrequencyRow[] = [];
  let cumulative = 0;

  for (let index = 0; index < k; index += 1) {
    const lower = min + index * width;
    const upper = index === k - 1 ? max : lower + width;
    const count = valid.filter((value) =>
      index === k - 1 ? value >= lower && value <= upper : value >= lower && value < upper,
    ).length;
    cumulative += count;
    const mark = (lower + upper) / 2;
    const relative = count / total;
    rows.push({
      lower,
      upper,
      mark,
      count,
      relative,
      percent: relative * 100,
      cumulative,
      cumulativePercent: (cumulative / total) * 100,
    });
  }

  return { rows, total, min, max, range, k, width, constant: false };
}
