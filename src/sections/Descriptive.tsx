import { Calculator, Ruler } from "lucide-react";
import { useApp } from "../state/AppContext";
import { QUANTITATIVE_VARIABLES, VARIABLE_MAP } from "../data/schema";
import type { QuantitativeKey } from "../data/types";
import { describe, type DescriptiveSummary } from "../stats/descriptive";
import { groupedFrequency } from "../stats/frequency";
import { formatInterval, formatNumber, formatPercent } from "../lib/format";
import {
  Badge,
  Callout,
  Card,
  EmptyState,
  Metric,
  ResetFiltersButton,
  SectionHeader,
  SelectField,
} from "../components/ui";

function modeText(key: QuantitativeKey, values: readonly number[], summary: DescriptiveSummary): string {
  const variable = VARIABLE_MAP[key];
  if (variable.type === "discrete") {
    if (summary.modes.length === 0) return "Sin moda única";
    return summary.modes.map((value) => formatNumber(value, 0)).join(", ");
  }
  const grouped = groupedFrequency(values, 6);
  const top = [...grouped.rows].sort((a, b) => b.count - a.count)[0];
  if (!top) return "No calculable";
  return `${formatInterval(top.lower, top.upper)} (${top.count})`;
}

function FiveNumberStrip({
  summary,
  unit,
}: {
  summary: DescriptiveSummary;
  unit: string | null;
}) {
  const { min, max, q1, median: medianValue, q3 } = summary;
  if (min === null || max === null || q1 === null || medianValue === null || q3 === null) {
    return null;
  }

  const width = 600;
  const padding = 44;
  const baseY = 34;
  const range = max - min;
  const scale = (value: number) =>
    range === 0 ? width / 2 : padding + ((value - min) / range) * (width - padding * 2);

  const minX = scale(min);
  const q1X = scale(q1);
  const medianX = scale(medianValue);
  const q3X = scale(q3);
  const maxX = scale(max);
  const boxHeight = 22;

  return (
    <svg
      viewBox={`0 0 ${width} 82`}
      className="h-24 w-full"
      role="img"
      aria-label={`Tira de cinco números de ${unit ?? "la variable"}: mínimo ${formatNumber(min)}, Q1 ${formatNumber(q1)}, mediana ${formatNumber(medianValue)}, Q3 ${formatNumber(q3)}, máximo ${formatNumber(max)}`}
    >
      <line x1={padding} y1={baseY + 12} x2={width - padding} y2={baseY + 12} stroke="currentColor" strokeOpacity="0.25" />
      <line x1={minX} y1={baseY + 4} x2={minX} y2={baseY + 20} stroke="currentColor" strokeOpacity="0.55" />
      <line x1={maxX} y1={baseY + 4} x2={maxX} y2={baseY + 20} stroke="currentColor" strokeOpacity="0.55" />
      <line x1={minX} y1={baseY + 12} x2={q1X} y2={baseY + 12} stroke="currentColor" strokeOpacity="0.55" />
      <line x1={q3X} y1={baseY + 12} x2={maxX} y2={baseY + 12} stroke="currentColor" strokeOpacity="0.55" />
      <rect
        x={Math.min(q1X, q3X)}
        y={baseY + 12 - boxHeight / 2}
        width={Math.max(2, Math.abs(q3X - q1X))}
        height={boxHeight}
        rx="4"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeOpacity="0.45"
      />
      <line
        x1={medianX}
        y1={baseY + 12 - boxHeight / 2}
        x2={medianX}
        y2={baseY + 12 + boxHeight / 2}
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      {[
        { x: minX, label: "Mín", value: min },
        { x: q1X, label: "Q1", value: q1 },
        { x: medianX, label: "Mediana", value: medianValue },
        { x: q3X, label: "Q3", value: q3 },
        { x: maxX, label: "Máx", value: max },
      ].map((tick) => (
        <g key={tick.label}>
          <text x={tick.x} y={68} textAnchor="middle" fill="currentColor" fillOpacity="0.6" fontSize="10">
            {tick.label}
          </text>
          <text x={tick.x} y={80} textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">
            {formatNumber(tick.value, 1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Descriptive() {
  const { state, filteredRows, resetFilters, setSelection } = useApp();
  const selectedKey = state.selections.descriptive;
  const variable = VARIABLE_MAP[selectedKey];
  const values = filteredRows.map((row) => row[selectedKey]);
  const summary = describe(values);
  const mode = modeText(selectedKey, values, summary);

  if (filteredRows.length === 0) {
    return (
      <section id="descriptiva" className="border-t border-border/70 py-10 sm:py-14">
        <SectionHeader
          number="05"
          icon={Calculator}
          title="Estadística descriptiva"
          description="Resume el centro, la dispersión y la posición de cada variable cuantitativa."
        />
        <EmptyState
          icon={Calculator}
          title="No hay datos para describir"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar las medidas descriptivas."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      </section>
    );
  }

  return (
    <section id="descriptiva" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="05"
        icon={Calculator}
        title="Estadística descriptiva"
        description="Media, mediana, cuartiles, dispersión y posición. Son resúmenes de la muestra visible, no parámetros de toda la población."
        aside={<Badge tone="accent">n = {filteredRows.length}</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Ruler aria-hidden="true" size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-fg">Variable seleccionada</h3>
          </div>
          <div className="mt-3">
            <SelectField
              label="Variable cuantitativa"
              value={selectedKey}
              onChange={(value) => setSelection("descriptive", value as QuantitativeKey)}
              options={QUANTITATIVE_VARIABLES.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
              hint={variable.unit ? `Unidad: ${variable.unit}` : undefined}
            />
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">Cinco números</p>
            <div className="mt-2 text-muted">
              <FiveNumberStrip summary={summary} unit={variable.unit} />
            </div>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-faint">
              La caja va de Q1 a Q3. La línea central es la mediana. Los extremos son el mínimo y el
              máximo observados.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Método. </span>
            Los cuartiles usan interpolación lineal tipo 7. La moda se informa solo para variables
            discretas; en continuas se muestra la clase modal con seis intervalos.
          </div>
        </Card>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Media" value={formatNumber(summary.mean, 1)} hint="Centro aritmético" accent />
            <Metric label="Mediana" value={formatNumber(summary.median, 1)} hint="Percentil 50" />
            <Metric
              label={variable.type === "continuous" ? "Clase modal" : "Moda"}
              value={variable.type === "continuous" ? "Clase modal" : mode}
              hint={variable.type === "continuous" ? mode : "Valor o valores más frecuentes"}
              valueClassName={variable.type === "continuous" ? "text-xl" : "text-xl break-words"}
            />
            <Metric label="Desv. estándar" value={formatNumber(summary.stdDev, 2)} hint="Dispersión muestral" />
            <Metric label="Mínimo" value={formatNumber(summary.min, 1)} hint="Valor menor" />
            <Metric label="Máximo" value={formatNumber(summary.max, 1)} hint="Valor mayor" />
            <Metric label="Rango" value={formatNumber(summary.range, 1)} hint="Máximo menos mínimo" />
            <Metric label="Varianza" value={formatNumber(summary.variance, 2)} hint="Desviación al cuadrado" />
            <Metric label="Q1" value={formatNumber(summary.q1, 1)} hint="25% debajo" />
            <Metric label="Q3" value={formatNumber(summary.q3, 1)} hint="75% debajo" />
            <Metric label="IQR" value={formatNumber(summary.iqr, 1)} hint="Q3 menos Q1" />
            <Metric label="CV" value={summary.cv === null ? "—" : formatPercent(summary.cv)} hint="Desviación / media" />
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-fg">Resumen de variables cuantitativas</h3>
              <Badge tone="neutral">{QUANTITATIVE_VARIABLES.length} variables</Badge>
            </div>
            <div className="table-wrap mt-3 max-h-[24rem] overflow-auto">
              <table className="data-table">
                <caption className="sr-only">Resumen descriptivo de todas las variables cuantitativas</caption>
                <thead>
                  <tr>
                    <th scope="col">Variable</th>
                    <th scope="col" className="num">n</th>
                    <th scope="col" className="num">Media</th>
                    <th scope="col" className="num">Mediana</th>
                    <th scope="col" className="num">DE</th>
                    <th scope="col" className="num">Mín</th>
                    <th scope="col" className="num">Máx</th>
                  </tr>
                </thead>
                <tbody>
                  {QUANTITATIVE_VARIABLES.map((item) => {
                    const itemSummary = describe(
                      filteredRows.map((row) => row[item.key as QuantitativeKey]),
                    );
                    return (
                      <tr key={item.key}>
                        <td className="font-medium text-fg">
                          {item.label}
                          {item.unit ? <span className="ml-1 text-[0.65rem] text-faint">({item.unit})</span> : null}
                        </td>
                        <td className="num">{itemSummary.n}</td>
                        <td className="num">{formatNumber(itemSummary.mean, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.median, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.stdDev, 2)}</td>
                        <td className="num">{formatNumber(itemSummary.min, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.max, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Callout tone="info" title="¿Cómo se interpreta?">
            En esta muestra, <strong className="text-fg">{variable.label}</strong> tiene una media de{" "}
            {formatNumber(summary.mean, 1)} {variable.unit ?? ""} y una mediana de{" "}
            {formatNumber(summary.median, 1)} {variable.unit ?? ""}. La desviación estándar es{" "}
            {formatNumber(summary.stdDev, 2)} {variable.unit ?? ""}, así que los datos se alejan de la
            media aproximadamente esa cantidad. El rango observado va de {formatNumber(summary.min, 1)} a{" "}
            {formatNumber(summary.max, 1)}. La media es sensible a valores extremos; la mediana y el IQR
            resumen mejor el centro y la dispersión cuando hay outliers.
          </Callout>
        </div>
      </div>
    </section>
  );
}
