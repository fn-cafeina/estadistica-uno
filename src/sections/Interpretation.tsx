import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Info,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { getChiPair } from "../data/analysis";
import {
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
  getVariableLabel,
} from "../data/schema";
import { chiSquareTest } from "../stats/chiSquare";
import { mean } from "../stats/descriptive";
import { pearsonCorrelation } from "../stats/correlation";
import { linearRegression } from "../stats/regression";
import {
  correlationText,
  formatEquation,
  formatNumber,
  formatPValue,
  formatPercent,
  pDecision,
  pDecisionText,
} from "../lib/format";
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Metric,
  ResetFiltersButton,
  SectionHeader,
} from "../components/ui";

export function Interpretation() {
  const { state, filteredRows, resetFilters, printReport, openHelp } = useApp();

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
  const chiPair = getChiPair(state.selections.chiPair);
  const chiResult = chiSquareTest(
    filteredRows.map((row) => ({
      row: getCategoricalValue(row, chiPair.rowKey),
      col: getCategoricalValue(row, chiPair.colKey),
    })),
    getCategories(chiPair.rowKey),
    getCategories(chiPair.colKey),
    state.alpha,
  );

  const comparisonCategories = getCategories(state.selections.comparisonVariable);
  const comparisonGroups = comparisonCategories
    .map((category) => {
      const subset = filteredRows.filter(
        (row) => getCategoricalValue(row, state.selections.comparisonVariable) === category,
      );
      return { label: category, n: subset.length, mean: mean(subset.map((row) => row.gpa)) };
    })
    .filter((group) => group.n > 0 && group.mean !== null);
  const bestGroup = [...comparisonGroups].sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))[0];
  const worstGroup = [...comparisonGroups].sort((a, b) => (a.mean ?? 0) - (b.mean ?? 0))[0];

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
      `En la tabla de ${getVariableLabel(chiPair.rowKey).toLowerCase()} por ${getVariableLabel(chiPair.colKey).toLowerCase()}, χ² = ${formatNumber(chiResult.statistic, 2)}, gl = ${chiResult.degreesOfFreedom} y p = ${formatPValue(chiResult.pValue)}. ${pDecisionText(chiResult.pValue, state.alpha)}`,
    );
  }
  if (bestGroup && worstGroup) {
    findings.push(
      `El promedio medio más alto aparece en ${bestGroup.label} (${formatNumber(bestGroup.mean, 1)} puntos) y el más bajo en ${worstGroup.label} (${formatNumber(worstGroup.mean, 1)} puntos). Son diferencias descriptivas entre grupos, no efectos causales.`,
    );
  }

  if (filteredRows.length === 0) {
    return (
      <section id="interpretacion" className="border-t border-border/70 py-10 sm:py-14">
        <SectionHeader
          number="08"
          icon={BookOpen}
          title="Interpretación y límites"
          description="Una síntesis de los hallazgos visibles y de lo que no se puede concluir."
        />
        <EmptyState
          icon={BookOpen}
          title="No hay resultados que interpretar"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar la síntesis."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      </section>
    );
  }

  return (
    <section id="interpretacion" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="08"
        icon={BookOpen}
        title="Interpretación y límites"
        description="La síntesis cambia con la muestra y los filtros. Estas conclusiones describen solo las filas visibles, no a la población universitaria."
        aside={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={Printer} onClick={printReport}>
              Imprimir reporte
            </Button>
            <Button size="sm" icon={HelpCircle} onClick={openHelp}>
              Glosario
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Registros" value={String(filteredRows.length)} hint="Muestra visible" accent />
        <Metric label="Promedio medio" value={formatNumber(averageGpa, 1)} hint="Puntos" />
        <Metric label="Pantalla media" value={formatNumber(averageScreen, 1)} hint="h/día" />
        <Metric label="r estudio-promedio" value={correlation ? formatNumber(correlation.r, 2) : "s/d"} hint={correlation ? correlation.strength : "No calculable"} />
        <Metric label="R²" value={regression ? formatNumber(regression.r2, 2) : "s/d"} hint="Variabilidad explicada" />
        <Metric label="Chi-cuadrado p" value={chiResult ? formatPValue(chiResult.pValue) : "s/d"} hint={`α = ${state.alpha}`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-fg">Hallazgos de la muestra visible</h3>
          </div>
          <ol className="mt-4 space-y-3">
            {findings.map((finding, index) => (
              <li key={finding} className="flex gap-3 rounded-lg border border-border bg-surface-2 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-[0.68rem] font-bold text-muted">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-muted">{finding}</p>
              </li>
            ))}
          </ol>

          {correlation && regression ? (
            <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">Modelo lineal principal</p>
              <code className="mt-1 block overflow-x-auto text-xs text-fg">
                {formatEquation(
                  regression.slope,
                  regression.intercept,
                  VARIABLE_MAP.studyHours.label,
                  VARIABLE_MAP.gpa.label,
                )}
              </code>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                {correlationText(correlation.r, correlation.strength, correlation.direction)}
              </p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-fg">Ficha de resultados</h3>
            </div>
            <dl className="mt-3 text-xs">
              <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2">
                <dt className="text-muted">n visible</dt>
                <dd className="font-semibold text-fg">{filteredRows.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2">
                <dt className="text-muted">Media del promedio</dt>
                <dd className="font-semibold text-fg">{formatNumber(averageGpa, 1)} puntos</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2">
                <dt className="text-muted">r estudio-promedio</dt>
                <dd className="font-semibold text-fg">{correlation ? formatNumber(correlation.r, 3) : "s/d"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2">
                <dt className="text-muted">R² de la regresión</dt>
                <dd className="font-semibold text-fg">{regression ? formatNumber(regression.r2, 3) : "s/d"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2">
                <dt className="text-muted">Chi-cuadrado</dt>
                <dd className="font-semibold text-fg">{chiResult ? formatNumber(chiResult.statistic, 2) : "s/d"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-muted">Decisión chi-cuadrado</dt>
                <dd className="text-right font-semibold text-fg">
                  {chiResult ? pDecision(chiResult.pValue, state.alpha) : "s/d"}
                </dd>
              </div>
            </dl>
          </Card>

          <Callout tone="warning" title="Lo que no se puede concluir" icon={AlertTriangle}>
            <ul className="list-disc space-y-1 pl-3">
              <li>La muestra es sintética: no describe estudiantes reales.</li>
              <li>Las asociaciones no demuestran causalidad.</li>
              <li>El promedio es autodeclarado y no equivale a un examen objetivo.</li>
              <li>Los niveles de rendimiento son una categorización didáctica, no una escala oficial.</li>
              <li>Con pocos casos o filtros agresivos, las estimaciones son inestables.</li>
            </ul>
          </Callout>

          <Callout tone="info" title="Para profundizar" icon={Info}>
            Revisa la sección de pruebas para ver hipótesis, supuestos y tablas completas. Descarga el
            CSV si necesitas recalcular en otra herramienta. La base completa está en la sección Base
            de datos.
          </Callout>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/60 px-4 py-3">
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-fg">Datos sintéticos con fines educativos.</span> No
          corresponde a estudiantes reales. Los resultados se calculan desde las filas visibles.
        </p>
        <Badge tone="neutral">UNAN-León · 2026</Badge>
      </div>
    </section>
  );
}
