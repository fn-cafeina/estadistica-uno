import {
  AlertTriangle,
  BookOpen,
  Info,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { useLab } from "../LabContext";
import { getChiPair } from "../chiPairs";
import {
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
  getVariableLabel,
} from "../../data/schema";
import { chiSquareTest } from "../../stats/chiSquare";
import { mean } from "../../stats/descriptive";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression } from "../../stats/regression";
import {
  correlationText,
  formatEquation,
  formatNumber,
  formatPValue,
  formatPercent,
  pDecision,
  pDecisionText,
} from "../../lib/format";
import {
  Section,
  Panel,
  Metric,
  Badge,
  Button,
  Interpretation,
  Callout,
  EmptyState,
  ResetFiltersButton,
  KeyValue,
} from "../components";

const GLOSSARY = [
  ["Media", "Promedio aritmético. Usa todos los valores y es sensible a los extremos."],
  ["Mediana", "Valor que deja al 50% de los datos por debajo. Resiste mejor los valores extremos."],
  ["Desviación estándar", "Distancia típica de los datos respecto a la media, en las mismas unidades."],
  ["Cuartil", "Valor que deja una proporción fija de datos por debajo. Q1 es el 25%, Q3 el 75%."],
  ["Chi-cuadrado", "Estadístico que compara frecuencias observadas y esperadas bajo independencia."],
  ["Valor p", "Probabilidad de obtener un resultado tan extremo si la hipótesis nula fuera cierta."],
  ["Correlación r", "Medida entre -1 y 1 de la dirección y fuerza de una relación lineal."],
  ["R²", "Proporción de la variabilidad de Y asociada linealmente con X en el modelo."],
];

export function InterpretationSection() {
  const { filteredRows, resetFilters, sample, filters } = useLab();
  const gpaValues = filteredRows.map((row) => row.gpa);
  const screenValues = filteredRows.map((row) => row.screenHours);
  const averageGpa = mean(gpaValues);
  const averageScreen = mean(screenValues);
  const correlation = pearsonCorrelation(
    filteredRows.map((row) => row.studyHours),
    gpaValues,
  );
  const regression = linearRegression(
    filteredRows.map((row) => row.studyHours),
    gpaValues,
  );
  const chiPair = getChiPair("usage");
  const chiResult = chiSquareTest(
    filteredRows.map((row) => ({
      row: getCategoricalValue(row, chiPair.rowKey),
      col: getCategoricalValue(row, chiPair.colKey),
    })),
    getCategories(chiPair.rowKey),
    getCategories(chiPair.colKey),
    0.05,
  );

  const findings: string[] = [];
  if (averageGpa !== null && averageScreen !== null) {
    findings.push(
      `La muestra visible tiene ${filteredRows.length} registros. El promedio académico medio es ${formatNumber(averageGpa, 1)} puntos y el tiempo medio frente a pantallas es ${formatNumber(averageScreen, 1)} horas al día.`,
    );
  }
  if (correlation) {
    findings.push(
      `La correlación entre horas de estudio semanal y promedio es r = ${formatNumber(correlation.r, 2)} (${correlation.strength}, ${correlation.direction}). El modelo lineal explica aproximadamente ${formatPercent(correlation.r2 * 100)} de la variabilidad del promedio.`,
    );
  }
  if (chiResult) {
    findings.push(
      `En la tabla de ${getVariableLabel(chiPair.rowKey).toLowerCase()} por ${getVariableLabel(chiPair.colKey).toLowerCase()}, χ² = ${formatNumber(chiResult.statistic, 2)}, gl = ${chiResult.degreesOfFreedom} y p = ${formatPValue(chiResult.pValue)}. ${pDecisionText(chiResult.pValue, 0.05)}`,
    );
  }
  if (regression) {
    findings.push(
      `La recta estimada es ${formatEquation(regression.slope, regression.intercept, "estudio", "promedio")}. Por cada hora semanal adicional de estudio, el promedio cambia en ${formatNumber(regression.slope, 2)} puntos en promedio.`,
    );
  }
  if (filters.major !== "all" || filters.sex !== "all" || filters.year !== "all") {
    findings.push(
      "Los filtros globales están activos. Todos los resultados describen únicamente las filas visibles, no la muestra completa.",
    );
  }

  return (
    <Section
      id="interpretacion"
      number="07 / INTERPRETACIÓN"
      icon={BookOpen}
      title={<>Lo que muestran los <em>datos</em>.</>}
      description="Una síntesis de los resultados visibles y de lo que no se puede concluir. La lectura cambia con la muestra y los filtros."
      aside={
        <Button icon={Printer} onClick={() => window.print()}>
          Imprimir reporte
        </Button>
      }
    >
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No hay resultados que interpretar"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar la síntesis."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="space-y-6">
          <div className="lab-metrics lab-metrics-3">
            <Metric label="Registros" value={filteredRows.length} hint={`Semilla ${sample.seed}`} accent />
            <Metric label="Promedio medio" value={formatNumber(averageGpa, 1)} hint="Puntos" />
            <Metric label="Pantalla media" value={`${formatNumber(averageScreen, 1)} h`} hint="Por día" />
            <Metric label="r estudio-promedio" value={correlation ? formatNumber(correlation.r, 2) : "s/d"} hint={correlation ? correlation.strength : "No calculable"} />
            <Metric label="R²" value={regression ? formatNumber(regression.r2, 2) : "s/d"} hint="Variabilidad explicada" />
            <Metric label="Chi-cuadrado p" value={chiResult ? formatPValue(chiResult.pValue) : "s/d"} hint="α = 0.05" />
          </div>

          <div className="lab-grid lab-grid-sidebar">
            <Panel title="Hallazgos de la muestra visible" meta={`n = ${filteredRows.length}`}>
              <ol className="space-y-3">
                {findings.map((finding, index) => (
                  <li key={finding} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <span className="font-mono text-label text-accent">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{finding}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                <Interpretation>
                  <p>
                    {correlationText(correlation?.r ?? 0, correlation?.strength ?? "sin relación", correlation?.direction ?? "nula")}{" "}
                    La lectura debe acompañarse por los tamaños de grupo, los supuestos de cada
                    procedimiento y el hecho de que la muestra es sintética.
                  </p>
                </Interpretation>
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel title="Ficha de resultados" meta="Resumen">
                <dl>
                  <KeyValue label="n visible" value={filteredRows.length} />
                  <KeyValue label="Media del promedio" value={`${formatNumber(averageGpa, 1)} puntos`} />
                  <KeyValue label="r estudio-promedio" value={correlation ? formatNumber(correlation.r, 3) : "s/d"} />
                  <KeyValue label="R² de la regresión" value={regression ? formatNumber(regression.r2, 3) : "s/d"} />
                  <KeyValue label="Chi-cuadrado" value={chiResult ? formatNumber(chiResult.statistic, 2) : "s/d"} />
                  <KeyValue
                    label="Decisión chi-cuadrado"
                    value={chiResult ? pDecision(chiResult.pValue, 0.05) : "s/d"}
                  />
                </dl>
              </Panel>

              <Callout title="Lo que no se puede concluir" tone="warning" icon={AlertTriangle}>
                <ul className="list-disc space-y-1 pl-4">
                  <li>La muestra es sintética: no describe estudiantes reales.</li>
                  <li>Las asociaciones no demuestran causalidad.</li>
                  <li>El promedio es una variable de la simulación, no una medición oficial.</li>
                  <li>Los niveles de rendimiento son una categorización didáctica.</li>
                  <li>Con pocos casos o filtros agresivos, las estimaciones son inestables.</li>
                </ul>
              </Callout>
            </div>
          </div>

          <Callout title="Cómo leer los resultados" icon={Info}>
            Empieza por la pregunta y por la muestra. Luego revisa el tamaño del efecto, no solo el
            valor p. Un resultado estadísticamente significativo puede no ser relevante en la
            práctica, y uno no significativo no demuestra que no exista relación.
          </Callout>

          <details className="lab-details">
            <summary>Glosario breve</summary>
            <div className="lab-details-content grid gap-x-5 gap-y-2 sm:grid-cols-2">
              {GLOSSARY.map(([term, definition]) => (
                <div key={term} className="border-t border-border pt-2">
                  <dt className="font-semibold text-fg">{term}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted">{definition}</dd>
                </div>
              ))}
            </div>
          </details>

          <div className="flex items-center gap-2 text-faint">
            <ShieldCheck aria-hidden="true" size={14} />
            <span className="text-label">
              {VARIABLE_MAP.gpa.label}: {formatNumber(averageGpa, 1)} puntos en la muestra visible.
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}
