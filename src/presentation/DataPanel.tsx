import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Download, RefreshCw, X } from "lucide-react";
import { useSample } from "../state/SampleContext";
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
  const { sample, regenerate, exportCsv } = useSample();
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
              {sample.n} registros sintéticos. Semilla {sample.seed}.
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
          <span className="deck-chip">Muestra fija · n = {sample.n}</span>
          <button type="button" className="deck-control" onClick={regenerate}>
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
                "rounded-[1px] border px-3 py-1.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.08em] transition-colors",
                tab === item.id
                  ? "border-accent bg-accent text-bg"
                  : "border-transparent text-muted hover:border-border-strong hover:text-fg",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4" role="tabpanel">
          {tab === "variables" ? (
            <div className="deck-table-wrap">
              <table className="deck-table min-w-[18rem] sm:min-w-[30rem]">
                <thead>
                  <tr>
                    <th scope="col">Variable</th>
                    <th scope="col">Tipo</th>
                    <th scope="col" className="hidden sm:table-cell">Código</th>
                  </tr>
                </thead>
                <tbody>
                  {VARIABLES.map((variable) => (
                    <tr key={variable.key}>
                      <td className="font-medium text-fg">
                        {variable.label}
                        <span className="mt-1 block text-[0.66rem] leading-relaxed text-faint sm:hidden">
                          {variable.unit ? `${variable.unit}. ` : ""}
                          {variable.coding}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-muted">{TYPE_LABEL[variable.type]}</td>
                      <td className="hidden max-w-[18ch] text-[0.68rem] leading-relaxed text-faint sm:table-cell">
                        {variable.unit ? `${variable.unit}. ` : ""}
                        {variable.coding}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "sample" ? (
            <div className="deck-table-wrap">
              <table className="deck-table min-w-[34rem]">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Carrera</th>
                    <th scope="col" className="num">Pantalla</th>
                    <th scope="col" className="num">Estudio</th>
                    <th scope="col" className="num">Promedio</th>
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
                      <td className="num">{formatNumber(row.screenHours, 1)}</td>
                      <td className="num">{formatNumber(row.studyHours, 1)}</td>
                      <td className="num font-semibold text-fg">{formatNumber(row.gpa, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <div key={item.label} className="border border-border bg-surface-2/40 p-3">
                  <p className="deck-label">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{item.value}</p>
                </div>
              ))}
              <div className="col-span-2 border border-border bg-surface-2/40 p-3">
                <p className="deck-label">Muestra</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {sample.n} registros sintéticos. La descarga incluye las 13 variables y la semilla{" "}
                  {sample.seed}.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}
