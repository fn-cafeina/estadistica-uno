import { motion, useReducedMotion } from "motion/react";
import type { ChiSquareResult } from "../../stats/chiSquare";
import { formatNumber } from "../../lib/format";

export function ContingencyGrid({
  result,
  showExpected,
}: {
  result: ChiSquareResult;
  showExpected: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  const values = showExpected ? result.expected.flat() : result.observed.flat();
  const maxValue = Math.max(1, ...values);

  return (
    <div className="deck-table-wrap">
      <table className="deck-table min-w-[18rem] sm:min-w-[31rem]">
        <caption className="sr-only">
          Tabla de contingencia de uso de tecnología para estudiar y nivel de rendimiento.
          {showExpected ? " Frecuencias esperadas." : " Frecuencias observadas."}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-[8.5rem] whitespace-normal sm:w-auto">
              Uso para estudiar
            </th>
            {result.colCategories.map((category) => (
              <th key={category} scope="col" className="num w-[3.2rem] sm:w-auto">
                {category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rowCategories.map((rowCategory, rowIndex) => (
            <tr key={rowCategory}>
              <td className="w-[8.5rem] whitespace-normal font-medium text-fg sm:w-auto">
                {rowCategory}
              </td>
              {result.colCategories.map((colCategory, colIndex) => {
                const value = showExpected
                  ? (result.expected[rowIndex]?.[colIndex] ?? 0)
                  : (result.observed[rowIndex]?.[colIndex] ?? 0);
                const intensity = scoreIntensity(value, maxValue);
                const lowExpected = showExpected && value < 5;
                return (
                  <td
                    key={colCategory}
                    className="num w-[3.2rem] tabular-nums sm:w-auto"
                    style={{
                      background: `color-mix(in srgb, var(--accent) ${intensity}%, transparent)`,
                    }}
                    title={lowExpected ? "Frecuencia esperada menor que 5" : undefined}
                  >
                    <motion.span
                      key={`${showExpected ? "e" : "o"}-${rowIndex}-${colIndex}-${value}`}
                      initial={reduced ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduced ? 0 : 0.26,
                        delay: reduced ? 0 : (rowIndex * result.colCategories.length + colIndex) * 0.018,
                      }}
                      className={lowExpected ? "font-semibold text-warning" : "text-fg"}
                    >
                      {showExpected ? formatNumber(value, 1) : value}
                    </motion.span>
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
                className="num w-[3.2rem] font-semibold text-muted sm:w-auto"
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
  return Math.round((value / maxValue) * 28);
}
