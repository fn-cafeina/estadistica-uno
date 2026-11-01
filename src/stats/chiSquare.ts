import { chiSquarePValue } from "./distributions";

export interface ContingencyPair {
  row: string;
  col: string;
}

export interface ChiSquareResult {
  rowCategories: string[];
  colCategories: string[];
  observed: number[][];
  expected: number[][];
  rowTotals: number[];
  colTotals: number[];
  total: number;
  statistic: number;
  degreesOfFreedom: number;
  pValue: number;
  cramersV: number | null;
  minExpected: number | null;
  cellsBelow5: number;
  totalCells: number;
  alpha: number;
  rejectNull: boolean;
  omittedRowCategories: string[];
  omittedColCategories: string[];
}

function uniqueCategories(values: readonly string[], order?: readonly string[]): string[] {
  const present = new Set(values);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of order ?? []) {
    if (present.has(value) && !seen.has(value)) {
      result.push(value);
      seen.add(value);
    }
  }

  for (const value of values) {
    if (!seen.has(value)) {
      result.push(value);
      seen.add(value);
    }
  }

  return result;
}

export function chiSquareTest(
  pairs: readonly ContingencyPair[],
  rowOrder?: readonly string[],
  colOrder?: readonly string[],
  alpha = 0.05,
): ChiSquareResult | null {
  if (pairs.length === 0) return null;

  const presentRows = new Set(pairs.map((pair) => pair.row));
  const presentCols = new Set(pairs.map((pair) => pair.col));

  const rowCategories = uniqueCategories(
    pairs.map((pair) => pair.row),
    rowOrder,
  ).filter((category) => {
    const total = pairs.filter((pair) => pair.row === category).length;
    return total > 0;
  });

  const colCategories = uniqueCategories(
    pairs.map((pair) => pair.col),
    colOrder,
  ).filter((category) => {
    const total = pairs.filter((pair) => pair.col === category).length;
    return total > 0;
  });

  if (rowCategories.length < 2 || colCategories.length < 2) return null;

  const observed = rowCategories.map((row) =>
    colCategories.map(
      (col) => pairs.filter((pair) => pair.row === row && pair.col === col).length,
    ),
  );

  const rowTotals = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const colTotals = colCategories.map((_, colIndex) =>
    observed.reduce((sum, row) => sum + (row[colIndex] ?? 0), 0),
  );
  const total = rowTotals.reduce((sum, value) => sum + value, 0);

  if (total === 0) return null;

  const expected = rowCategories.map((_, rowIndex) =>
    colCategories.map((__, colIndex) => {
      const rowTotal = rowTotals[rowIndex] ?? 0;
      const colTotal = colTotals[colIndex] ?? 0;
      return (rowTotal * colTotal) / total;
    }),
  );

  let statistic = 0;
  for (let rowIndex = 0; rowIndex < observed.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCategories.length; colIndex += 1) {
      const observedValue = observed[rowIndex]?.[colIndex] ?? 0;
      const expectedValue = expected[rowIndex]?.[colIndex] ?? 0;
      if (expectedValue > 0) {
        statistic += ((observedValue - expectedValue) ** 2) / expectedValue;
      }
    }
  }

  const degreesOfFreedom = (rowCategories.length - 1) * (colCategories.length - 1);
  if (degreesOfFreedom < 1) return null;

  const pValue = chiSquarePValue(statistic, degreesOfFreedom);
  const denominator = total * Math.min(rowCategories.length - 1, colCategories.length - 1);
  const cramersV = denominator > 0 && Number.isFinite(statistic) ? Math.sqrt(statistic / denominator) : null;

  const flatExpected = expected.flat();
  const minExpected = flatExpected.length > 0 ? Math.min(...flatExpected) : null;
  const cellsBelow5 = flatExpected.filter((value) => value < 5).length;

  const omittedRowCategories = (rowOrder ?? []).filter((category) => !presentRows.has(category));
  const omittedColCategories = (colOrder ?? []).filter((category) => !presentCols.has(category));

  return {
    rowCategories,
    colCategories,
    observed,
    expected,
    rowTotals,
    colTotals,
    total,
    statistic,
    degreesOfFreedom,
    pValue,
    cramersV,
    minExpected,
    cellsBelow5,
    totalCells: flatExpected.length,
    alpha,
    rejectNull: Number.isFinite(pValue) && pValue < alpha,
    omittedRowCategories,
    omittedColCategories,
  };
}
