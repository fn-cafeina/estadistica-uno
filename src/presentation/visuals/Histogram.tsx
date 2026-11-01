import { motion, useReducedMotion } from "motion/react";
import type { GroupedFrequencyRow } from "../../stats/frequency";
import { formatInterval, formatNumber } from "../../lib/format";

export function Histogram({
  rows,
  mean,
  label,
  unit,
}: {
  rows: readonly GroupedFrequencyRow[];
  mean: number | null;
  label: string;
  unit: string | null;
}) {
  const reduced = useReducedMotion();
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const meanBin = rows.findIndex((row) => {
    if (mean === null) return false;
    return mean >= row.lower && mean <= row.upper;
  });

  if (rows.length === 0) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted">
        No hay datos para mostrar.
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-48 flex-col"
      role="img"
      aria-label={`Histograma de ${label}. Media ${formatNumber(mean, 1)} ${unit ?? ""}.`}
    >
      <div className="flex flex-1 items-end gap-1.5 border-b border-border pb-2 sm:gap-2">
        {rows.map((row, index) => {
          const height = Math.max(2, (row.count / maxCount) * 100);
          const isMean = index === meanBin;
          return (
            <div key={`${row.lower}-${row.upper}`} className="flex h-full flex-1 flex-col justify-end">
              <motion.span
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.25 + index * 0.05 }}
                className="mb-1 text-center font-mono text-[0.58rem] tabular-nums text-faint"
              >
                {row.count}
              </motion.span>
              <motion.div
                initial={reduced ? false : { height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: reduced ? 0 : 0.62, delay: reduced ? 0 : index * 0.05 }}
                className={
                  isMean
                    ? "w-full border-t-2 border-warning bg-warning/30"
                    : "w-full border-t border-accent/80 bg-accent/20"
                }
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {rows.map((row) => (
          <div
            key={`label-${row.lower}-${row.upper}`}
            className="min-w-0 flex-1 text-center font-mono text-[0.54rem] tabular-nums text-faint"
            title={formatInterval(row.lower, row.upper)}
          >
            {formatNumber(row.lower, 1)}
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[0.62rem] text-faint">
        {label}
        {unit ? ` (${unit})` : ""}
      </p>
    </div>
  );
}
