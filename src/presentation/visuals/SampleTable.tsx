import { motion, useReducedMotion } from "motion/react";
import type { StudentRecord } from "../../data/types";
import { formatNumber } from "../../lib/format";

export function SampleTable({
  rows,
  seed,
}: {
  rows: readonly StudentRecord[];
  seed: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const visible = rows.slice(0, 6);

  return (
    <motion.div
      key={seed}
      initial={reduced ? false : { opacity: 0.2 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.32 }}
      className="deck-table-wrap"
    >
      <table className="deck-table min-w-[26rem]">
        <caption className="sr-only">
          Primeras filas de la muestra sintética de estudiantes. Datos educativos, no reales.
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col" className="num">Pantalla</th>
            <th scope="col" className="num">Estudio</th>
            <th scope="col" className="num">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <motion.tr
              key={`${seed}-${row.id}`}
              initial={reduced ? false : { opacity: 0, x: -7 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduced ? 0 : 0.35,
                delay: reduced ? 0 : 0.05 + index * 0.045,
              }}
            >
              <td className="font-mono text-xs text-faint">{String(row.id).padStart(2, "0")}</td>
              <td className="num">{formatNumber(row.screenHours, 1)} h/día</td>
              <td className="num">{formatNumber(row.studyHours, 1)} h/sem</td>
              <td className="num font-semibold text-fg">{formatNumber(row.gpa, 1)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
