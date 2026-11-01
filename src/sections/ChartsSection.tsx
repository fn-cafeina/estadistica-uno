import { BarChart3, Info, SlidersHorizontal } from "lucide-react";
import { useApp } from "../state/AppContext";
import {
  BAR_VARIABLES,
  COMPARISON_VARIABLES,
  PIE_VARIABLES,
} from "../data/analysis";
import {
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
  getVariableLabel,
  getVariableShortLabel,
  getVariableUnit,
} from "../data/schema";
import type { QualitativeKey, QuantitativeKey } from "../data/types";
import { categoricalFrequency, groupedFrequency, sturgesBins } from "../stats/frequency";
import { mean } from "../stats/descriptive";
import { pearsonCorrelation } from "../stats/correlation";
import { linearRegression } from "../stats/regression";
import {
  correlationText,
  formatEquation,
  formatInterval,
  formatNumber,
  formatPercent,
} from "../lib/format";
import {
  BarFrequencyChart,
  ComparisonChart,
  DoughnutChart,
  HistogramChart,
  ScatterRegressionChart,
} from "../components/charts/charts";
import { ChartCard } from "../components/charts/ChartCard";
import {
  Badge,
  Callout,
  Card,
  EmptyState,
  ResetFiltersButton,
  SectionHeader,
  SelectField,
} from "../components/ui";

export function ChartsSection() {
  const { state, filteredRows, resetFilters, setSelection } = useApp();
  const s = state.selections;

  const barVariable = s.barVariable;
  const barFrequency = categoricalFrequency(
    filteredRows.map((row) => getCategoricalValue(row, barVariable)),
    { order: getCategories(barVariable), includeZero: true },
  );
  const topBar = [...barFrequency.rows].sort((a, b) => b.count - a.count)[0];

  const histVariable = s.freqQuantitative;
  const histValues = filteredRows.map((row) => row[histVariable]);
  const hist = groupedFrequency(histValues, s.bins === 0 ? undefined : s.bins);
  const topHist = [...hist.rows].sort((a, b) => b.count - a.count)[0];
  const suggestedBins = sturgesBins(filteredRows.length);

  const pieFrequency = categoricalFrequency(
    filteredRows.map((row) => getCategoricalValue(row, s.pieVariable)),
    { order: getCategories(s.pieVariable), includeZero: true },
  );
  const topPie = [...pieFrequency.rows].sort((a, b) => b.count - a.count)[0];

  const correlation = pearsonCorrelation(
    filteredRows.map((row) => row[s.correlationX]),
    filteredRows.map((row) => row[s.correlationY]),
  );
  const regression = linearRegression(
    filteredRows.map((row) => row[s.correlationX]),
    filteredRows.map((row) => row[s.correlationY]),
  );
  const xVariable = VARIABLE_MAP[s.correlationX];
  const yVariable = VARIABLE_MAP[s.correlationY];

  const comparisonCategories = getCategories(s.comparisonVariable);
  const comparisonGroups = comparisonCategories.map((category) => {
    const subset = filteredRows.filter(
      (row) => getCategoricalValue(row, s.comparisonVariable) === category,
    );
    return {
      label: category,
      n: subset.length,
      mean: mean(subset.map((row) => row.gpa)),
    };
  });
  const validGroups = comparisonGroups.filter((group) => group.mean !== null);
  const highestGroup = [...validGroups].sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))[0];
  const lowestGroup = [...validGroups].sort((a, b) => (a.mean ?? 0) - (b.mean ?? 0))[0];
  const smallGroups = comparisonGroups.filter((group) => group.n > 0 && group.n < 5);

  return (
    <section id="graficos" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="07"
        icon={BarChart3}
        title="Gráficos"
        description="Visualizaciones vinculadas a la base visible. Cada tarjeta incluye unidades, una lectura breve y la tabla exacta que respalda el dibujo."
        aside={<Badge tone="accent">n = {filteredRows.length}</Badge>}
      />

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No hay datos para graficar"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar los gráficos y sus tablas."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <>
          <Card className="mb-5 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" size={15} className="text-accent" />
              <h3 className="text-sm font-semibold text-fg">Controles de los gráficos</h3>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SelectField
                label="Barras"
                value={barVariable}
                onChange={(value) => setSelection("barVariable", value as QualitativeKey)}
                options={BAR_VARIABLES.map((key) => ({ value: key, label: getVariableLabel(key) }))}
              />
              <SelectField
                label="Histograma"
                value={histVariable}
                onChange={(value) => setSelection("freqQuantitative", value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({
                  value: variable.key,
                  label: variable.label,
                }))}
              />
              <SelectField
                label="Intervalos"
                value={String(s.bins)}
                onChange={(value) => setSelection("bins", Number(value))}
                options={[
                  { value: "0", label: `Auto (Sturges: ${suggestedBins})` },
                  ...Array.from({ length: 10 }, (_, index) => index + 3).map((bins) => ({
                    value: String(bins),
                    label: `${bins} intervalos`,
                  })),
                ]}
              />
              <SelectField
                label="Circular"
                value={s.pieVariable}
                onChange={(value) => setSelection("pieVariable", value as QualitativeKey)}
                options={PIE_VARIABLES.map((key) => ({ value: key, label: getVariableLabel(key) }))}
              />
              <SelectField
                label="Comparación"
                value={s.comparisonVariable}
                onChange={(value) => setSelection("comparisonVariable", value as QualitativeKey)}
                options={COMPARISON_VARIABLES.map((key) => ({
                  value: key,
                  label: getVariableLabel(key),
                }))}
              />
            </div>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-faint">
              El histograma comparte variable e intervalos con la sección Distribuciones. La
              dispersión usa el par elegido en Correlación.
            </p>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title={`Frecuencia de ${getVariableLabel(barVariable).toLowerCase()}`}
              subtitle="Barras horizontales · frecuencia absoluta por categoría"
              icon={BarChart3}
              interpretation={
                topBar ? (
                  <>
                    La categoría más frecuente es <strong className="text-fg">{topBar.value}</strong>{" "}
                    con {topBar.count} casos ({formatPercent(topBar.percent)}). Las barras permiten
                    comparar categorías, pero no muestran relaciones causales.
                  </>
                ) : (
                  "No hay categorías para mostrar."
                )
              }
              table={
                <div className="table-wrap max-h-60 overflow-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">{getVariableLabel(barVariable)}</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barFrequency.rows.map((row) => (
                        <tr key={row.value}>
                          <td>{row.value}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            >
              <BarFrequencyChart rows={barFrequency.rows} label={getVariableLabel(barVariable)} />
            </ChartCard>

            <ChartCard
              title={`Histograma de ${getVariableLabel(histVariable).toLowerCase()}`}
              subtitle={`Intervalos de clase · ${getVariableUnit(histVariable) ?? "unidades"}`}
              icon={BarChart3}
              interpretation={
                topHist ? (
                  <>
                    El intervalo con más casos es{" "}
                    <strong className="text-fg">{formatInterval(topHist.lower, topHist.upper)}</strong>{" "}
                    con {topHist.count} casos. El polígono une las marcas de clase y suaviza la lectura
                    de la forma; el histograma conserva los conteos por intervalo.
                  </>
                ) : (
                  "No hay valores para agrupar."
                )
              }
              table={
                <div className="table-wrap max-h-60 overflow-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Intervalo</th>
                        <th scope="col" className="num">Marca</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hist.rows.map((row) => (
                        <tr key={`${row.lower}-${row.upper}`}>
                          <td>{hist.constant ? formatNumber(row.lower, 1) : formatInterval(row.lower, row.upper)}</td>
                          <td className="num">{formatNumber(row.mark, 1)}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            >
              <HistogramChart
                rows={hist.rows}
                label={getVariableLabel(histVariable)}
                unit={getVariableUnit(histVariable)}
              />
            </ChartCard>

            <ChartCard
              title={`Composición por ${getVariableLabel(s.pieVariable).toLowerCase()}`}
              subtitle="Gráfico circular · proporción de estudiantes"
              icon={Info}
              interpretation={
                topPie ? (
                  <>
                    La categoría con mayor peso es <strong className="text-fg">{topPie.value}</strong>{" "}
                    con {topPie.count} casos ({formatPercent(topPie.percent)}). El total al centro es
                    n = {pieFrequency.total}. El gráfico circular funciona aquí porque hay pocas
                    categorías; con muchas, una tabla o barras se leen mejor.
                  </>
                ) : (
                  "No hay categorías para mostrar."
                )
              }
              table={
                <div className="table-wrap max-h-60 overflow-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">{getVariableLabel(s.pieVariable)}</th>
                        <th scope="col" className="num">f</th>
                        <th scope="col" className="num">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pieFrequency.rows.map((row) => (
                        <tr key={row.value}>
                          <td>{row.value}</td>
                          <td className="num">{row.count}</td>
                          <td className="num">{formatPercent(row.percent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            >
              <DoughnutChart
                rows={pieFrequency.rows}
                label={getVariableLabel(s.pieVariable)}
                total={pieFrequency.total}
              />
            </ChartCard>

            <ChartCard
              title={`Promedio según ${getVariableLabel(s.comparisonVariable).toLowerCase()}`}
              subtitle="Comparación de medias por categoría · promedio académico en puntos"
              icon={BarChart3}
              interpretation={
                highestGroup && lowestGroup ? (
                  <>
                    La media más alta aparece en <strong className="text-fg">{highestGroup.label}</strong>{" "}
                    ({formatNumber(highestGroup.mean, 1)} puntos) y la más baja en{" "}
                    <strong className="text-fg">{lowestGroup.label}</strong> (
                    {formatNumber(lowestGroup.mean, 1)} puntos). Son medias de grupo; no controlan otras
                    variables y no demuestran causalidad.
                    {smallGroups.length > 0
                      ? ` Hay ${smallGroups.length} grupo(s) con menos de 5 casos: sus medias son inestables.`
                      : ""}
                  </>
                ) : (
                  "No hay grupos con datos suficientes."
                )
              }
              table={
                <div className="table-wrap max-h-60 overflow-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">{getVariableLabel(s.comparisonVariable)}</th>
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
                </div>
              }
            >
              <ComparisonChart
                groups={comparisonGroups}
                variableLabel={getVariableLabel(s.comparisonVariable)}
                outcomeLabel="Promedio académico"
                outcomeUnit="puntos"
              />
            </ChartCard>

            <div className="xl:col-span-2">
              <ChartCard
                title={`Dispersión de ${getVariableLabel(s.correlationX).toLowerCase()} y ${getVariableLabel(s.correlationY).toLowerCase()}`}
                subtitle={`Puntos observados y recta de mínimos cuadrados${
                  regression ? ` · ${formatEquation(regression.slope, regression.intercept, "X", "Y")}` : ""
                }`}
                icon={BarChart3}
                interpretation={
                  correlation ? (
                    <>
                      {correlationText(correlation.r, correlation.strength, correlation.direction)} La
                      recta resume la tendencia promedio. Los puntos alejados de la recta son residuos
                      grandes y pueden influir en el ajuste. Recuerda: asociación no es causalidad.
                    </>
                  ) : (
                    "Se necesitan al menos tres pares válidos y variabilidad en ambas variables."
                  )
                }
                table={
                  regression ? (
                    <div className="table-wrap max-h-64 overflow-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th scope="col" className="num">{xVariable.label}</th>
                            <th scope="col" className="num">{yVariable.label}</th>
                            <th scope="col" className="num">Estimado</th>
                            <th scope="col" className="num">Residuo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regression.points.map((point, index) => (
                            <tr key={`${point.x}-${point.y}-${index}`}>
                              <td className="num">{formatNumber(point.x, 1)}</td>
                              <td className="num">{formatNumber(point.y, 1)}</td>
                              <td className="num">{formatNumber(point.predicted, 1)}</td>
                              <td className="num">{formatNumber(point.residual, 2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null
                }
              >
                {correlation && regression ? (
                  <ScatterRegressionChart
                    correlation={correlation}
                    regression={regression}
                    xLabel={getVariableShortLabel(s.correlationX)}
                    xUnit={getVariableUnit(s.correlationX)}
                    yLabel={getVariableShortLabel(s.correlationY)}
                    yUnit={getVariableUnit(s.correlationY)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 px-6 text-center text-xs text-muted">
                    No hay suficientes pares válidos para dibujar la dispersión y la recta.
                  </div>
                )}
              </ChartCard>
            </div>
          </div>

          {smallGroups.length > 0 ? (
            <div className="mt-5">
              <Callout tone="warning" title="Grupos pequeños en la comparación" icon={Info}>
                {smallGroups.map((group) => `${group.label} (n=${group.n})`).join(", ")}. Las medias
                de grupos con menos de cinco casos pueden cambiar mucho con una sola observación.
              </Callout>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
