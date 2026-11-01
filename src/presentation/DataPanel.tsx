import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Download, RefreshCw, X } from "lucide-react";
import { useSample } from "../state/SampleContext";
import {
  SAMPLE_SIZES,
  type SampleSize,
} from "../data/types";
import { VARIABLES, getCategories, getCategoricalValue } from "../data/schema";
import { describe } from "../stats/descriptive";
import { pearsonCorrelation } from "../stats/correlation";
import { linearRegression } from "../stats/regression";
import { chiSquareTest } from "../stats/chiSquare";
import { formatNumber, formatPValue } from "../lib/format";
import { cn } from "./SceneFrame";

type Tab = "variables" | "sample" | "summary";

const TYPE_LABEL = {
  nominal: "Nominal",
  ordinal: "Ordinal",
  discrete: "Discreta",
  continuous: "Continua",
} as const;

export function DataPanel({ onClose }: { onClose: () => void }) {
  const { sample, sampleSize, setSampleSize, regenerate, exportCsv } = useSample();
  const [tab, setTab] = useState<Tab>("variables");
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const stats = useMemo(() => {
    const gpa = describe(sample.rows.map((row) => row.gpa));
    const correlation = pearsonCorrelation(
      sample.rows.map((row) => row.studyHours),
      sample.rows.map((row) => row.gpa),
    );
    const regression = linearRegression(
      sample.rows.map((row) => row.studyHours),
      sample.rows.map((row) => row.gpa),
    );
    const chi = chiSquareTest(
      sample.rows.map((row) => ({
        row: getCategoricalValue(row, "studyTechFrequency"),
        col: getCategoricalValue(row, "performanceLevel"),
      })),
      getCategories("studyTechFrequency"),
      getCategories("performanceLevel"),
      0.05,
    );
    return { gpa, correlation, regression, chi };
  }, [sample]);

  return (
    <>
      <motion.div
        className="deck-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.18 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        className="deck-data"
        role="dialog"
        aria-modal="true"
        aria-label="Panel de datos de la muestra"
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }}
        transition={{ duration: reduced ? 0 : 0.22 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="deck-kicker">Detrás de los datos</p>
            <h2 className="mt-2 font-display text-2xl text-fg">La muestra</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {sample.n} registros sintéticos. Semilla {sample.seed}. Útil para preguntas del público.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="deck-icon-button"
            aria-label="Cerrar panel de datos"
            onClick={onClose}
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-border py-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            <span className="text-faint">Tamaño</span>
            <select
              className="h-9 w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-fg"
              value={sampleSize}
              onChange={(event) => setSampleSize(Number(event.target.value) as SampleSize)}
            >
              {SAMPLE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="deck-control"
            onClick={() => regenerate(sampleSize)}
          >
            <RefreshCw aria-hidden="true" size={14} />
            Nueva muestra
          </button>
          <button type="button" className="deck-control" onClick={exportCsv}>
            <Download aria-hidden="true" size={14} />
            CSV
          </button>
        </div>

        <div className="mt-4 flex gap-1" role="tablist" aria-label="Contenido de datos">
          {[
            { id: "variables" as const, label: "Variables" },
            { id: "sample" as const, label: "Muestra" },
            { id: "summary" as const, label: "Resumen" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === item.id
                  ? "bg-accent text-bg"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4" role="tabpanel">
          {tab === "variables" ? (
            <table className="deck-table">
              <thead>
                <tr>
                  <th scope="col">Variable</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Código</th>
                </tr>
              </thead>
              <tbody>
                {VARIABLES.map((variable) => (
                  <tr key={variable.key}>
                    <td className="font-medium text-fg">{variable.label}</td>
                    <td className="whitespace-nowrap text-muted">{TYPE_LABEL[variable.type]}</td>
                    <td className="max-w-[18ch] text-[0.68rem] leading-relaxed text-faint">
                      {variable.unit ? `${variable.unit}. ` : ""}
                      {variable.coding}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "sample" ? (
            <table className="deck-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Carrera</th>
                  <th scope="col">Pantalla</th>
                  <th scope="col">Estudio</th>
                  <th scope="col">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {sample.rows.slice(0, 10).map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[0.65rem] text-faint">
                      {String(row.id).padStart(2, "0")}
                    </td>
                    <td className="max-w-[16ch] truncate text-muted" title={row.major}>
                      {row.major}
                    </td>
                    <td>{formatNumber(row.screenHours, 1)}</td>
                    <td>{formatNumber(row.studyHours, 1)}</td>
                    <td className="font-semibold text-fg">{formatNumber(row.gpa, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "summary" ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Registros", value: String(sample.n) },
                { label: "Promedio medio", value: formatNumber(stats.gpa.mean, 1) },
                { label: "Mediana", value: formatNumber(stats.gpa.median, 1) },
                { label: "Desv. estándar", value: formatNumber(stats.gpa.stdDev, 2) },
                {
                  label: "Correlación r",
                  value: stats.correlation ? formatNumber(stats.correlation.r, 2) : "s/d",
                },
                {
                  label: "R²",
                  value: stats.regression ? formatNumber(stats.regression.r2, 2) : "s/d",
                },
                {
                  label: "Chi-cuadrado p",
                  value: stats.chi ? formatPValue(stats.chi.pValue) : "s/d",
                },
                {
                  label: "Celdas esperadas < 5",
                  value: stats.chi
                    ? `${stats.chi.cellsBelow5} / ${stats.chi.totalCells}`
                    : "s/d",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-surface/60 p-3">
                  <p className="deck-label">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{item.value}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-lg border border-border bg-surface/60 p-3">
                <p className="deck-label">Muestra</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {sample.n} registros sintéticos. La descarga incluye las 13 variables y la semilla{" "}
                  {sample.seed}.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mt-5 border-t border-border pt-3 text-[0.66rem] leading-relaxed text-faint">
          Atajos: D abre y cierra este panel. N muestra el guion. F alterna pantalla completa.
        </p>
      </motion.aside>
    </>
  );
}
