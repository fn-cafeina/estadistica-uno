import type { ChiSquareResult } from "../../stats/chiSquare";
import { formatNumber } from "../../lib/format";

export function ContingencyGrid({
  result,
  showExpected,
}: {
  result: ChiSquareResult;
  showExpected: boolean;
}) {
  const values = showExpected ? result.expected.flat() : result.observed.flat();
  const maxValue = Math.max(1, ...values);

  return (
    <div className="overflow-x-auto">
      <table className="deck-table">
        <caption className="sr-only">
          Tabla de contingencia de uso de tecnología para estudiar y nivel de rendimiento.
          {showExpected ? " Frecuencias esperadas." : " Frecuencias observadas."}
        </caption>
        <thead>
          <tr>
            <th scope="col">Uso para estudiar</th>
            {result.colCategories.map((category) => (
              <th key={category} scope="col" className="text-right">
                {category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rowCategories.map((rowCategory, rowIndex) => (
            <tr key={rowCategory}>
              <td className="font-medium text-fg">{rowCategory}</td>
              {result.colCategories.map((colCategory, colIndex) => {
                const value = showExpected
                  ? (result.expected[rowIndex]?.[colIndex] ?? 0)
                  : (result.observed[rowIndex]?.[colIndex] ?? 0);
                const intensity = scoreIntensity(value, maxValue);
                const lowExpected = showExpected && value < 5;
                return (
                  <td
                    key={colCategory}
                    className="text-right tabular-nums"
                    style={{
                      background: `color-mix(in srgb, var(--accent) ${intensity}%, transparent)`,
                    }}
                    title={lowExpected ? "Frecuencia esperada menor que 5" : undefined}
                  >
                    <span className={lowExpected ? "font-semibold text-warning" : "text-fg"}>
                      {showExpected ? formatNumber(value, 1) : value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="font-semibold text-muted">Total</td>
            {result.colTotals.map((total, index) => (
              <td
                key={`${result.colCategories[index] ?? index}-total`}
                className="text-right font-semibold text-muted"
              >
                {total}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function scoreIntensity(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.round((value / maxValue) * 42);
}
