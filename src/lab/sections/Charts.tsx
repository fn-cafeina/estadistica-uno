import { BarChart3, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useLab } from "../LabContext";
import {
  QUALITATIVE_VARIABLES,
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
} from "../../data/schema";
import type { QualitativeKey, QuantitativeKey } from "../../data/types";
import { categoricalFrequency, groupedFrequency } from "../../stats/frequency";
import { mean } from "../../stats/descriptive";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression } from "../../stats/regression";
import { formatEquation, formatInterval, formatNumber, formatPercent } from "../../lib/format";
import {
  Section,
  Panel,
  SelectField,
  Badge,
  Interpretation,
  TableWrap,
  EmptyState,
  ResetFiltersButton,
  Callout,
} from "../components";
import {
  ChartCard,
  BarChart,
  HistogramChart,
  PieChart,
  ScatterChart,
  ComparisonChart,
} from "../charts";

export function Charts() {
  const { filteredRows, resetFilters } = useLab();
  const [barVariable, setBarVariable] = useState<QualitativeKey>("major");
  const [histVariable, setHistVariable] = useState<QuantitativeKey>("screenHours");
  const [pieVariable, setPieVariable] = useState<QualitativeKey>("device");
  const [comparisonVariable, setComparisonVariable] = useState<QualitativeKey>("studyTechFrequency");
  const [scatterX, setScatterX] = useState<QuantitativeKey>("studyHours");
  const [scatterY, setScatterY] = useState<QuantitativeKey>("gpa");
  const [bins, setBins] = useState(8);

  const barRows = useMemo(
    () =>
      categoricalFrequency(
        filteredRows.map((row) => getCategoricalValue(row, barVariable)),
        { order: getCategories(barVariable), includeZero: true },
      ).rows,
    [barVariable, filteredRows],
  );
  const histValues = filteredRows.map((row) => row[histVariable]);
  const histGrouped = groupedFrequency(histValues, bins);
  const histMean = mean(histValues);
  const pieRows = useMemo(
    () =>
      categoricalFrequency(
        filteredRows.map((row) => getCategoricalValue(row, pieVariable)),
        { order: getCategories(pieVariable), includeZero: true },
      ).rows,
    [filteredRows, pieVariable],
  );
  const scatterPoints = filteredRows.map((row) => ({ x: row[scatterX], y: row[scatterY] }));
  const correlation = pearsonCorrelation(
    scatterPoints.map((point) => point.x),
    scatterPoints.map((point) => point.y),
  );
  const regression = linearRegression(
    scatterPoints.map((point) => point.x),
    scatterPoints.map((point) => point.y),
  );
  const comparisonGroups = getCategories(comparisonVariable).map((category) => {
    const subset = filteredRows.filter(
      (row) => getCategoricalValue(row, comparisonVariable) === category,
    );
    return { label: category, n: subset.length, mean: mean(subset.map((row) => row.gpa)) };
  });
  const validGroups = comparisonGroups.filter((group) => group.n > 0 && group.mean !== null);
  const bestGroup = [...validGroups].sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))[0];
  const worstGroup = [...validGroups].sort((a, b) => (a.mean ?? 0) - (b.mean ?? 0))[0];
  const topBar = [...barRows].sort((a, b) => b.count - a.count)[0];
  const topHist = [...histGrouped.rows].sort((a, b) => b.count - a.count)[0];
  const topPie = [...pieRows].sort((a, b) => b.count - a.count)[0];
  const barLabel = VARIABLE_MAP[barVariable].label;
  const histLabel = VARIABLE_MAP[histVariable].label;
  const histUnit = VARIABLE_MAP[histVariable].unit;
  const pieLabel = VARIABLE_MAP[pieVariable].label;
  const comparisonLabel = VARIABLE_MAP[comparisonVariable].label;
  const xVariable = VARIABLE_MAP[scatterX];
  const yVariable = VARIABLE_MAP[scatterY];

  return (
    <Section
      id="graficos"
      number="06 / GRÁFICOS"
      icon={BarChart3}
      title={<>Mirar los datos <em>también</em>.</>}
      description="Los gráficos usan las filas visibles y se actualizan con la muestra, los filtros y los selectores. Cada uno incluye una lectura breve y su tabla de respaldo."
      aside={<Badge tone="accent">SVG nativo</Badge>}
    >
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No hay datos para graficar"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar los gráficos."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="space-y-6">
          <Panel title="Controles de los gráficos" meta="Variables y intervalos">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SelectField
                label="Barras"
                value={barVariable}
                onChange={(value) => setBarVariable(value as QualitativeKey)}
                options={QUALITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
              <SelectField
                label="Histograma"
                value={histVariable}
                onChange={(value) => setHistVariable(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
              <SelectField
                label="Intervalos"
                value={String(bins)}
                onChange={(value) => setBins(Number(value))}
                options={Array.from({ length: 10 }, (_, index) => index + 3).map((count) => ({
                  value: String(count),
                  label: `${count}`,
                }))}
              />
              <SelectField
                label="Circular"
                value={pieVariable}
                onChange={(value) => setPieVariable(value as QualitativeKey)}
                options={QUALITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
              <SelectField
                label="Comparación"
                value={comparisonVariable}
                onChange={(value) => setComparisonVariable(value as QualitativeKey)}
                options={QUALITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
              <SelectField
                label="Dispersión X"
                value={scatterX}
                onChange={(value) => {
                  if (value === scatterY) setScatterY(scatterX);
                  setScatterX(value as QuantitativeKey);
                }}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
              <SelectField
                label="Dispersión Y"
                value={scatterY}
                onChange={(value) => {
                  if (value === scatterX) setScatterX(scatterY);
                  setScatterY(value as QuantitativeKey);
                }}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.shortLabel }))}
              />
            </div>
          </Panel>

          <div className="lab-grid lab-grid-2">
            <ChartCard
              title="Frecuencia por categoría"
              subtitle={barLabel}
              interpretation={
                topBar ? (
                  <p>
                    La categoría con más registros es <strong className="text-fg">{topBar.value}</strong>{" "}
                    con {topBar.count} casos ({formatPercent(topBar.percent)}). Es una descripción de la
                    muestra visible, no una relación causal.
                  </p>
                ) : null
              }
              table={
                <TableWrap>
                  <table className="lab-table">
                    <caption className="sr-only">Datos del gráfico de barras de {barLabel}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Categoría</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barRows.map((row) => (
                        <tr key={row.value}>
                          <td>{row.value}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              }
            >
              <BarChart
                rows={barRows}
                label={barLabel}
                ariaLabel={`Gráfico de barras de frecuencia de ${barLabel}`}
              />
            </ChartCard>

            <ChartCard
              title="Histograma y polígono de frecuencias"
              subtitle={`${histLabel}${histUnit ? ` (${histUnit})` : ""} · ${bins} intervalos`}
              interpretation={
                topHist ? (
                  <p>
                    La clase con más casos es{" "}
                    <strong className="text-fg">{formatInterval(topHist.lower, topHist.upper)}</strong>{" "}
                    con {topHist.count} casos ({formatPercent(topHist.percent)}). La línea une las
                    marcas de clase; la franja de color es la frecuencia absoluta.
                  </p>
                ) : null
              }
              table={
                <TableWrap>
                  <table className="lab-table">
                    <caption className="sr-only">Datos del histograma de {histLabel}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Intervalo</th>
                        <th scope="col" className="num">Marca</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {histGrouped.rows.map((row) => (
                        <tr key={`${row.lower}-${row.upper}`}>
                          <td>{formatInterval(row.lower, row.upper)}</td>
                          <td className="num">{formatNumber(row.mark, 1)}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              }
            >
              <HistogramChart
                rows={histGrouped.rows}
                mean={histMean}
                label={histLabel}
                unit={histUnit}
                ariaLabel={`Histograma de ${histLabel} con polígono de frecuencias`}
              />
            </ChartCard>

            <ChartCard
              title="Composición porcentual"
              subtitle={pieLabel}
              interpretation={
                topPie ? (
                  <p>
                    <strong className="text-fg">{topPie.value}</strong> ocupa {formatPercent(topPie.percent)}{" "}
                    de la muestra visible ({topPie.count} casos). El gráfico circular sirve para
                    composición; no compara promedios ni muestra asociación.
                  </p>
                ) : null
              }
              table={
                <TableWrap>
                  <table className="lab-table">
                    <caption className="sr-only">Datos del gráfico circular de {pieLabel}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Categoría</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pieRows.map((row) => (
                        <tr key={row.value}>
                          <td>{row.value}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              }
            >
              <PieChart
                rows={pieRows}
                label={pieLabel}
                ariaLabel={`Gráfico circular de composición de ${pieLabel}`}
              />
            </ChartCard>

            <ChartCard
              title="Promedio según categoría"
              subtitle={`${comparisonLabel} · promedio académico`}
              interpretation={
                bestGroup && worstGroup ? (
                  <p>
                    El promedio medio más alto aparece en{" "}
                    <strong className="text-fg">{bestGroup.label}</strong> (
                    {formatNumber(bestGroup.mean, 1)} puntos) y el más bajo en{" "}
                    <strong className="text-fg">{worstGroup.label}</strong> (
                    {formatNumber(worstGroup.mean, 1)} puntos). Son diferencias descriptivas; los
                    grupos pequeños deben leerse con cautela.
                  </p>
                ) : null
              }
              table={
                <TableWrap>
                  <table className="lab-table">
                    <caption className="sr-only">Promedio académico por {comparisonLabel}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Categoría</th>
                        <th scope="col" className="num">n</th>
                        <th scope="col" className="num">Media</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonGroups.map((group) => (
                        <tr key={group.label}>
                          <td>{group.label}</td>
                          <td className="num">{group.n}</td>
                          <td className="num">{formatNumber(group.mean, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              }
            >
              <ComparisonChart
                groups={comparisonGroups}
                label={comparisonLabel}
                unit="puntos"
                ariaLabel={`Promedio académico medio por ${comparisonLabel}`}
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Dispersión y recta de regresión"
            subtitle={`${xVariable.label}${xVariable.unit ? ` (${xVariable.unit})` : ""} y ${yVariable.label}${yVariable.unit ? ` (${yVariable.unit})` : ""}`}
            interpretation={
              correlation && regression ? (
                <p>
                  En la muestra visible, r = <strong className="text-fg">{formatNumber(correlation.r, 2)}</strong>{" "}
                  ({correlation.strength}, {correlation.direction}). La recta estimada es{" "}
                  <code className="text-fg">{formatEquation(regression.slope, regression.intercept, xVariable.shortLabel, yVariable.shortLabel)}</code>.
                </p>
              ) : null
            }
            table={
              <TableWrap className="max-h-64 overflow-auto">
                <table className="lab-table">
                  <caption className="sr-only">Datos de la dispersión de {xVariable.label} y {yVariable.label}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="num">{xVariable.label}</th>
                      <th scope="col" className="num">{yVariable.label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scatterPoints.map((point, index) => (
                      <tr key={`${point.x}-${point.y}-${index}`}>
                        <td className="num">{formatNumber(point.x, 1)}</td>
                        <td className="num">{formatNumber(point.y, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            }
          >
            <ScatterChart
              points={scatterPoints}
              regression={regression}
              xLabel={xVariable.shortLabel}
              yLabel={yVariable.shortLabel}
              xUnit={xVariable.unit}
              yUnit={yVariable.unit}
              ariaLabel={`Dispersión de ${xVariable.label} y ${yVariable.label} con recta de regresión`}
            />
          </ChartCard>

          <div className="grid gap-3 lg:grid-cols-3">
            <Interpretation>
              <p>
                Un gráfico describe la muestra visible. La forma, los valores extremos y los grupos
                pequeños cambian la lectura. Siempre conviene mirar la tabla de respaldo.
              </p>
            </Interpretation>
            <Callout title="Los ejes importan" icon={Info}>
              Revisa las unidades y el rango de los ejes antes de comparar. Una escala distinta puede
              hacer que la misma diferencia parezca grande o pequeña.
            </Callout>
            <Callout title="Asociación visual" tone="warning">
              Una nube de puntos o una recta no prueban causalidad. Solo muestran cómo se mueven dos
              variables en esta muestra.
            </Callout>
          </div>
        </div>
      )}
    </Section>
  );
}
