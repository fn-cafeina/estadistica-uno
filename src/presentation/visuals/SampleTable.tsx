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
  const reduced = useReducedMotion();
  const visible = rows.slice(0, 6);

  return (
    <motion.div
      key={seed}
      initial={reduced ? false : { opacity: 0.35, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
      className="overflow-hidden"
    >
      <table className="deck-table">
        <caption className="sr-only">
          Primeras filas de la muestra sintética de estudiantes. Datos educativos, no reales.
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Pantalla</th>
            <th scope="col">Estudio</th>
            <th scope="col">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id}>
              <td className="font-mono text-xs text-faint">{String(row.id).padStart(2, "0")}</td>
              <td>{formatNumber(row.screenHours, 1)} h/día</td>
              <td>{formatNumber(row.studyHours, 1)} h/sem</td>
              <td className="font-semibold text-fg">{formatNumber(row.gpa, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
