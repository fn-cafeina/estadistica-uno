import { Calculator, Ruler } from "lucide-react";
import { useState } from "react";
import { useLab } from "../LabContext";
import { QUANTITATIVE_VARIABLES, VARIABLE_MAP } from "../../data/schema";
import type { QuantitativeKey } from "../../data/types";
import { describe, type DescriptiveSummary } from "../../stats/descriptive";
import { groupedFrequency } from "../../stats/frequency";
import { formatInterval, formatNumber, formatPercent } from "../../lib/format";
import { FiveNumberChart } from "../charts";
import {
  Section,
  Panel,
  SelectField,
  Metric,
  Interpretation,
  TableWrap,
  EmptyState,
  ResetFiltersButton,
  Callout,
} from "../components";

function modeText(key: QuantitativeKey, values: readonly number[], summary: DescriptiveSummary): string {
  const variable = VARIABLE_MAP[key];
  if (variable.type === "discrete") {
    if (summary.modes.length === 0) return "Sin moda única";
    return summary.modes.map((value) => formatNumber(value, 0)).join(", ");
  }
  const grouped = groupedFrequency(values, 6);
  const top = [...grouped.rows].sort((a, b) => b.count - a.count)[0];
  return top ? `${formatInterval(top.lower, top.upper)} (${top.count})` : "No calculable";
}

// El resumen de la variable seleccionada no cabe como cifras destacadas: doce
// valores más en tarjetas grandes tapan los cuatro que importan.
function additionalStats(
  continuous: boolean,
  mode: string,
  summary: DescriptiveSummary,
): Array<[string, string, string]> {
  return [
    [
      continuous ? "Clase modal" : "Moda",
      mode,
      continuous ? "Intervalo con más casos" : "Valor más frecuente",
    ],
    ["Mínimo", formatNumber(summary.min, 1), "Valor menor observado"],
    ["Máximo", formatNumber(summary.max, 1), "Valor mayor observado"],
    ["Rango", formatNumber(summary.range, 1), "Máximo menos mínimo"],
    ["Varianza", formatNumber(summary.variance, 2), "Desviación al cuadrado (muestral)"],
    ["Q1", formatNumber(summary.q1, 1), "25% de los datos por debajo"],
    ["Q3", formatNumber(summary.q3, 1), "75% de los datos por debajo"],
    ["IQR", formatNumber(summary.iqr, 1), "Q3 menos Q1"],
    ["P10", formatNumber(summary.p10, 1), "Percentil 10"],
    ["P90", formatNumber(summary.p90, 1), "Percentil 90"],
    ["CV", summary.cv === null ? "s/d" : formatPercent(summary.cv), "Desviación estándar / media"],
    ["Atípicos", String(summary.outlierCount), "Fuera de 1.5 × IQR"],
  ];
}

export function Descriptive() {
  const { filteredRows, resetFilters } = useLab();
  const [selectedKey, setSelectedKey] = useState<QuantitativeKey>("gpa");
  const variable = VARIABLE_MAP[selectedKey];
  const values = filteredRows.map((row) => row[selectedKey]);
  const summary = describe(values);
  const mode = modeText(selectedKey, values, summary);

  return (
    <Section
      id="descriptiva"
      title={<>El centro y la <em>dispersión</em>.</>}
      description="Media, mediana, cuantiles y desviación estándar de la muestra visible. Son resúmenes descriptivos, no parámetros de toda la población."
    >
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No hay datos para describir"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar las medidas descriptivas."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="space-y-6">
          <Panel title="Variable seleccionada" meta={variable.unit ? `Unidad: ${variable.unit}` : undefined}>
            <div className="grid gap-5 lg:grid-cols-[0.3fr_0.7fr] lg:items-start">
              <div>
                <SelectField
                  label="Variable cuantitativa"
                  value={selectedKey}
                  onChange={(value) => setSelectedKey(value as QuantitativeKey)}
                  options={QUANTITATIVE_VARIABLES.map((item) => ({
                    value: item.key,
                    label: item.label,
                  }))}
                />
                <div className="mt-4 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted">
                  <span className="font-semibold text-fg">Método. </span>
                  Cuartiles con interpolación lineal tipo 7. En variables continuas se informa la clase
                  modal con seis intervalos. Varianza y desviación estándar son muestrales.
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Ruler aria-hidden="true" size={14} className="text-accent" />
                  <p className="lab-label">Cinco números</p>
                </div>
                <FiveNumberChart
                  summary={summary}
                  ariaLabel={`Tira de cinco números de ${variable.label}: mínimo ${formatNumber(summary.min, 1)}, Q1 ${formatNumber(summary.q1, 1)}, mediana ${formatNumber(summary.median, 1)}, Q3 ${formatNumber(summary.q3, 1)}, máximo ${formatNumber(summary.max, 1)}`}
                />
                <p className="mt-1 text-label leading-relaxed text-faint">
                  La caja va de Q1 a Q3. La línea central es la mediana. Los extremos son el mínimo y
                  el máximo observados.
                </p>
              </div>
            </div>
          </Panel>

          <div className="lab-metrics">
            <Metric label="n válido" value={summary.n} hint="Datos finitos" accent />
            <Metric label="Media" value={formatNumber(summary.mean, 1)} hint={variable.unit ?? "Promedio aritmético"} />
            <Metric label="Mediana" value={formatNumber(summary.median, 1)} hint="Percentil 50" />
            <Metric label="Desv. estándar" value={formatNumber(summary.stdDev, 2)} hint="Dispersión muestral" />
          </div>

          <Panel title="Estadísticos adicionales" meta={variable.unit ? `Unidad: ${variable.unit}` : undefined}>
            <TableWrap>
              <table className="lab-table min-w-[30rem]">
                <caption className="sr-only">
                  Estadísticos adicionales de {variable.label}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Estadístico</th>
                    <th scope="col" className="num">Valor</th>
                    <th scope="col">Lectura</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalStats(variable.type === "continuous", mode, summary).map(([label, value, note]) => (
                    <tr key={label}>
                      <td className="font-medium text-fg">{label}</td>
                      <td className="num">{value}</td>
                      <td className="text-muted">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Panel>

          <Panel title="Resumen de variables cuantitativas" meta={`${QUANTITATIVE_VARIABLES.length} variables`}>
            <TableWrap className="max-h-[26rem] overflow-auto" hint="Desliza para ver todas las columnas.">
              <table className="lab-table min-w-[46rem]">
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
                    <th scope="col" className="num">Q1</th>
                    <th scope="col" className="num">Q3</th>
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
                          {item.unit ? (
                            <span className="ml-1 text-label text-faint">({item.unit})</span>
                          ) : null}
                        </td>
                        <td className="num">{itemSummary.n}</td>
                        <td className="num">{formatNumber(itemSummary.mean, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.median, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.stdDev, 2)}</td>
                        <td className="num">{formatNumber(itemSummary.min, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.max, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.q1, 1)}</td>
                        <td className="num">{formatNumber(itemSummary.q3, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </Panel>

            <Interpretation>
              <p>
                En esta muestra, <strong className="text-fg">{variable.label}</strong> tiene una media
                de {formatNumber(summary.mean, 1)} {variable.unit ?? ""} y una mediana de{" "}
                {formatNumber(summary.median, 1)} {variable.unit ?? ""}. La desviación estándar es{" "}
                {formatNumber(summary.stdDev, 2)} {variable.unit ?? ""}; el rango observado va de{" "}
                {formatNumber(summary.min, 1)} a {formatNumber(summary.max, 1)}. El 50% central está
                entre Q1 = {formatNumber(summary.q1, 1)} y Q3 = {formatNumber(summary.q3, 1)}.
              </p>
              <p>
                La media usa todos los valores y es sensible a los extremos; la mediana y el IQR
                resisten mejor los atípicos. Si se separan mucho, conviene revisar la forma de la
                distribución y los valores extremos.
              </p>
            </Interpretation>
        </div>
      )}
    </Section>
  );
}
