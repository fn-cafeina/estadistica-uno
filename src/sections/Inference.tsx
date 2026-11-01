import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  FlaskConical,
  Info,
  LineChart,
  Sigma,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { CHI_PAIRS, getChiPair } from "../data/analysis";
import {
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
  getVariableLabel,
} from "../data/schema";
import type { QuantitativeKey } from "../data/types";
import { chiSquareTest } from "../stats/chiSquare";
import { pearsonCorrelation } from "../stats/correlation";
import { linearRegression, predictValue } from "../stats/regression";
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
  SelectField,
  cn,
} from "../components/ui";

function cramersStrength(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "No calculable";
  if (value < 0.1) return "Asociación negligible";
  if (value < 0.3) return "Asociación baja";
  if (value < 0.5) return "Asociación moderada";
  return "Asociación alta";
}

function ChiSquareCard() {
  const { state, filteredRows, setSelection, setAlpha } = useApp();
  const [showExpected, setShowExpected] = useState(false);
  const pair = getChiPair(state.selections.chiPair);

  const result = useMemo(() => {
    const pairs = filteredRows.map((row) => ({
      row: getCategoricalValue(row, pair.rowKey),
      col: getCategoricalValue(row, pair.colKey),
    }));
    return chiSquareTest(
      pairs,
      getCategories(pair.rowKey),
      getCategories(pair.colKey),
      state.alpha,
    );
  }, [filteredRows, pair.rowKey, pair.colKey, state.alpha]);

  const expectedWarning = result !== null && result.cellsBelow5 > 0;
  const decision = result ? pDecision(result.pValue, state.alpha) : "indeterminada";
  const omitted = result ? [...result.omittedRowCategories, ...result.omittedColCategories] : [];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">
            <FlaskConical aria-hidden="true" size={13} />
            Prueba de independencia
          </p>
          <h3 className="mt-1 text-lg font-semibold text-fg">Chi-cuadrado</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{pair.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
          <SelectField
            label="Par de variables"
            value={pair.id}
            onChange={(value) => setSelection("chiPair", value as typeof pair.id)}
            options={CHI_PAIRS.map((option) => ({ value: option.id, label: option.shortLabel }))}
          />
          <SelectField
            label="Nivel de significación"
            value={String(state.alpha)}
            onChange={(value) => setAlpha(Number(value))}
            options={[
              { value: "0.01", label: "α = 0.01" },
              { value: "0.05", label: "α = 0.05" },
              { value: "0.10", label: "α = 0.10" },
            ]}
          />
        </div>
      </div>

      {!result ? (
        <div className="mt-4">
          <Callout tone="warning" title="No se puede calcular la prueba" icon={AlertTriangle}>
            Se necesitan al menos dos categorías en cada variable y datos suficientes después de los
            filtros. Revisa la muestra visible o cambia el par de variables.
          </Callout>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Chi-cuadrado" value={formatNumber(result.statistic, 2)} hint="χ² observado" accent />
            <Metric label="Grados de libertad" value={String(result.degreesOfFreedom)} hint="(filas − 1)(columnas − 1)" />
            <Metric label="Valor p" value={formatPValue(result.pValue)} hint={`α = ${state.alpha}`} />
            <Metric label="Cramér's V" value={formatNumber(result.cramersV, 2)} hint={cramersStrength(result.cramersV)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card-soft p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">Hipótesis nula</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                H₀: <span className="text-fg">{getVariableLabel(pair.rowKey)}</span> y{" "}
                <span className="text-fg">{getVariableLabel(pair.colKey)}</span> son independientes.
              </p>
            </div>
            <div className="card-soft p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">Hipótesis alternativa</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                H₁: existe asociación entre {getVariableLabel(pair.rowKey)} y{" "}
                {getVariableLabel(pair.colKey)}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Tabla {showExpected ? "de frecuencias esperadas" : "de frecuencias observadas"} · n ={" "}
              {result.total}
            </p>
            <Button size="sm" onClick={() => setShowExpected((value) => !value)}>
              {showExpected ? "Ver observadas" : "Ver esperadas"}
            </Button>
          </div>

          <div className="table-wrap max-h-[26rem] overflow-auto">
            <table className="data-table">
              <caption className="sr-only">
                Tabla de contingencia de {getVariableLabel(pair.rowKey)} y {getVariableLabel(pair.colKey)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{getVariableLabel(pair.rowKey)}</th>
                  {result.colCategories.map((category) => (
                    <th key={category} scope="col" className="num">
                      {category}
                    </th>
                  ))}
                  <th scope="col" className="num">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rowCategories.map((rowCategory, rowIndex) => (
                  <tr key={rowCategory}>
                    <td className="font-medium text-fg">{rowCategory}</td>
                    {result.colCategories.map((colCategory, colIndex) => {
                      const value = showExpected
                        ? (result.expected[rowIndex]?.[colIndex] ?? 0)
                        : (result.observed[rowIndex]?.[colIndex] ?? 0);
                      const lowExpected = showExpected && value < 5;
                      return (
                        <td
                          key={colCategory}
                          className={cn("num", lowExpected && "bg-warning/10 font-semibold text-warning")}
                          title={lowExpected ? "Frecuencia esperada menor que 5" : undefined}
                        >
                          {showExpected ? formatNumber(value, 1) : value}
                        </td>
                      );
                    })}
                    <td className="num font-semibold">{result.rowTotals[rowIndex]}</td>
                  </tr>
                ))}
                <tr className="bg-surface-2 font-semibold">
                  <td>Total</td>
                  {result.colTotals.map((total, index) => (
                    <td key={result.colCategories[index] ?? index} className="num">
                      {total}
                    </td>
                  ))}
                  <td className="num">{result.total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {showExpected ? (
            <p className="text-[0.7rem] leading-relaxed text-faint">
              Las celdas resaltadas tienen una frecuencia esperada menor que 5. Esa es la señal
              clásica de que la aproximación chi-cuadrado puede ser imprecisa.
            </p>
          ) : null}

          <Callout
            tone={expectedWarning ? "warning" : "success"}
            title={expectedWarning ? "Revisar supuestos" : "Supuesto de frecuencias esperadas"}
            icon={expectedWarning ? AlertTriangle : CheckCircle2}
          >
            {expectedWarning ? (
              <>
                {result.cellsBelow5} de {result.totalCells} celdas tienen frecuencia esperada menor que
                5 (mínimo: {formatNumber(result.minExpected, 2)}). La prueba puede ser inestable.
                Aumenta el tamaño de la muestra, reduce categorías o interpreta el valor p con cautela.
              </>
            ) : (
              <>
                Todas las frecuencias esperadas son al menos 5. El supuesto habitual para la
                aproximación chi-cuadrado se cumple en esta tabla.
              </>
            )}
            {omitted.length > 0 ? (
              <span className="mt-1 block">
                Se omitieron categorías sin observaciones: {omitted.join(", ")}.
              </span>
            ) : null}
          </Callout>

          <Callout
            tone={decision === "rechazar" ? "success" : "info"}
            title={
              decision === "rechazar"
                ? "Se rechaza la hipótesis nula"
                : decision === "no rechazar"
                  ? "No se rechaza la hipótesis nula"
                  : "Decisión no calculable"
            }
            icon={decision === "rechazar" ? CheckCircle2 : Info}
          >
            {pDecisionText(result.pValue, state.alpha)} Cramér's V ={" "}
            {formatNumber(result.cramersV, 2)}: {cramersStrength(result.cramersV).toLowerCase()}. La
            prueba detecta asociación, no dirección ni causalidad.
          </Callout>

          <Callout tone="info" title="¿Cómo se interpreta?">
            El estadístico χ² mide cuánto se alejan las frecuencias observadas de las que esperaríamos
            si las dos variables fueran independientes. Un valor grande y un valor p pequeño sugieren
            asociación. Los grados de libertad dependen del número de filas y columnas. No se puede
            concluir que una variable cause a la otra: solo que, en esta muestra, se apartan de la
            independencia.
          </Callout>
        </div>
      )}
    </Card>
  );
}

function CorrelationCard() {
  const { state, filteredRows, setSelection } = useApp();
  const xKey = state.selections.correlationX;
  const yKey = state.selections.correlationY;
  const xVariable = VARIABLE_MAP[xKey];
  const yVariable = VARIABLE_MAP[yKey];
  const result = pearsonCorrelation(
    filteredRows.map((row) => row[xKey]),
    filteredRows.map((row) => row[yKey]),
  );

  const changeX = (value: QuantitativeKey) => {
    if (value === yKey) setSelection("correlationY", xKey);
    setSelection("correlationX", value);
  };

  const changeY = (value: QuantitativeKey) => {
    if (value === xKey) setSelection("correlationX", yKey);
    setSelection("correlationY", value);
  };

  const swap = () => {
    setSelection("correlationX", yKey);
    setSelection("correlationY", xKey);
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">
            <Sigma aria-hidden="true" size={13} />
            Asociación lineal
          </p>
          <h3 className="mt-1 text-lg font-semibold text-fg">Correlación de Pearson</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
            Mide la dirección y la fuerza de una relación lineal entre dos variables cuantitativas.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
          <SelectField
            label="Variable X"
            value={xKey}
            onChange={(value) => changeX(value as QuantitativeKey)}
            options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
          />
          <div className="flex items-end gap-2">
            <SelectField
              label="Variable Y"
              value={yKey}
              onChange={(value) => changeY(value as QuantitativeKey)}
              options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              className="flex-1"
            />
            <Button icon={ArrowLeftRight} onClick={swap} aria-label="Intercambiar X e Y">
              Cambiar
            </Button>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="mt-4">
          <Callout tone="warning" title="No se puede calcular la correlación" icon={AlertTriangle}>
            Se necesitan al menos tres pares válidos y variabilidad en ambas variables. Revisa los
            filtros o elige otro par.
          </Callout>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Coeficiente r" value={formatNumber(result.r, 3)} hint={`${result.strength}, ${result.direction}`} accent />
            <Metric label="R²" value={formatNumber(result.r2, 3)} hint={`${formatPercent(result.r2 * 100)} de variabilidad`} />
            <Metric label="Pares válidos" value={String(result.n)} hint="Observaciones completas" />
            <Metric label="Valor p" value={formatPValue(result.pValue)} hint="Prueba bilateral" />
          </div>

          <div className="formula">
            r = Σ[(xᵢ − x̄)(yᵢ − ȳ)] / √[Σ(xᵢ − x̄)² · Σ(yᵢ − ȳ)²]
          </div>

          <Callout tone="info" title="¿Cómo se interpreta?">
            {correlationText(result.r, result.strength, result.direction)} Su cuadrado, r² ={" "}
            {formatNumber(result.r2, 3)}, indica que aproximadamente{" "}
            {formatPercent(result.r2 * 100)} de la variabilidad de {yVariable.label.toLowerCase()} se
            asocia linealmente con {xVariable.label.toLowerCase()} en esta muestra. La asociación es{" "}
            {result.direction} y {result.strength}.
          </Callout>

          <Callout tone="warning" title="Correlación no implica causalidad" icon={AlertTriangle}>
            Que dos variables se muevan juntas no significa que una cause a la otra. Puede haber
            variables omitidas, causalidad inversa o simples coincidencias. Además, Pearson solo
            detecta relaciones lineales y es sensible a valores extremos.
          </Callout>
        </div>
      )}
    </Card>
  );
}

function RegressionCard() {
  const { state, filteredRows, setSelection } = useApp();
  const xKey = state.selections.regressionX;
  const yKey = state.selections.regressionY;
  const xVariable = VARIABLE_MAP[xKey];
  const yVariable = VARIABLE_MAP[yKey];
  const [predictionInput, setPredictionInput] = useState("");

  const result = linearRegression(
    filteredRows.map((row) => row[xKey]),
    filteredRows.map((row) => row[yKey]),
  );

  const changeX = (value: QuantitativeKey) => {
    if (value === yKey) setSelection("regressionY", xKey);
    setSelection("regressionX", value);
  };

  const changeY = (value: QuantitativeKey) => {
    if (value === xKey) setSelection("regressionX", yKey);
    setSelection("regressionY", value);
  };

  const swap = () => {
    setSelection("regressionX", yKey);
    setSelection("regressionY", xKey);
  };

  const parsedPrediction = Number(predictionInput);
  const hasPrediction = predictionInput.trim() !== "" && Number.isFinite(parsedPrediction);
  const predicted = result && hasPrediction ? predictValue(result, parsedPrediction) : null;
  const outsideRange =
    result && hasPrediction
      ? parsedPrediction < result.xMin || parsedPrediction > result.xMax
      : false;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">
            <LineChart aria-hidden="true" size={13} />
            Modelo lineal
          </p>
          <h3 className="mt-1 text-lg font-semibold text-fg">Regresión lineal simple</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
            Estima cómo cambia Y, en promedio, cuando X cambia en una unidad. La recta se ajusta por
            mínimos cuadrados ordinarios.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
          <SelectField
            label="Variable X"
            value={xKey}
            onChange={(value) => changeX(value as QuantitativeKey)}
            options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
          />
          <div className="flex items-end gap-2">
            <SelectField
              label="Variable Y"
              value={yKey}
              onChange={(value) => changeY(value as QuantitativeKey)}
              options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              className="flex-1"
            />
            <Button icon={ArrowLeftRight} onClick={swap} aria-label="Intercambiar X e Y">
              Cambiar
            </Button>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="mt-4">
          <Callout tone="warning" title="No se puede ajustar la recta" icon={AlertTriangle}>
            Se necesitan al menos tres pares válidos y variabilidad en X e Y. La regresión no está
            definida con varianza cero o con muy pocos datos.
          </Callout>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Pendiente" value={formatNumber(result.slope, 3)} hint={`${yVariable.unit ?? "unidades"} por ${xVariable.unit ?? "unidad"}`} accent />
            <Metric label="Intercepto" value={formatNumber(result.intercept, 2)} hint="Valor estimado cuando X = 0" />
            <Metric label="R²" value={formatNumber(result.r2, 3)} hint={`${formatPercent(result.r2 * 100)} de variabilidad`} />
            <Metric label="Error típico" value={formatNumber(result.standardError, 2)} hint={`n = ${result.n}`} />
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">Ecuación estimada</p>
            <code className="mt-2 block overflow-x-auto text-sm text-fg">
              {formatEquation(result.slope, result.intercept, xVariable.label, yVariable.label)}
            </code>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Por cada unidad adicional de {xVariable.label.toLowerCase()}, el valor estimado de{" "}
              {yVariable.label.toLowerCase()} cambia en {formatNumber(result.slope, 3)}{" "}
              {yVariable.unit ?? "unidades"} en promedio. El intercepto es el valor estimado cuando X
              vale 0; puede no tener sentido sustantivo si 0 está fuera del rango observado.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="card-soft p-4">
              <h4 className="text-sm font-semibold text-fg">Predicción dentro del rango</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Rango observado de X: {formatNumber(result.xMin, 1)} a {formatNumber(result.xMax, 1)}{" "}
                {xVariable.unit ?? ""}. Predice solo dentro de ese intervalo.
              </p>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-muted">
                  Valor de {xVariable.label}
                </span>
                <input
                  type="number"
                  className="field"
                  step="any"
                  placeholder={`Entre ${formatNumber(result.xMin, 1)} y ${formatNumber(result.xMax, 1)}`}
                  value={predictionInput}
                  onChange={(event) => setPredictionInput(event.target.value)}
                />
              </label>
              {hasPrediction && predicted !== null ? (
                <div className={cn("mt-3 rounded-lg border p-3", outsideRange ? "border-warning/30 bg-warning/10" : "border-success/30 bg-success/10")}>
                  <p className="text-xs text-muted">Predicción estimada</p>
                  <p className="mt-1 text-xl font-semibold text-fg">
                    {formatNumber(predicted, 1)} {yVariable.unit ?? ""}
                  </p>
                  {outsideRange ? (
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-warning">
                      El valor está fuera del rango observado. Es una extrapolación y debe tomarse con
                      mucha cautela.
                    </p>
                  ) : (
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                      Dentro del rango observado. Es una estimación media, no una garantía individual.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[0.7rem] text-faint">
                  Escribe un valor de X para obtener la estimación de Y.
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-fg">Observados y estimados</h4>
                <Badge tone="neutral">{result.n} pares</Badge>
              </div>
              <div className="table-wrap max-h-72 overflow-auto">
                <table className="data-table">
                  <caption className="sr-only">Valores observados, estimados y residuos de la regresión</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="num">{xVariable.label}</th>
                      <th scope="col" className="num">{yVariable.label} observado</th>
                      <th scope="col" className="num">Estimado</th>
                      <th scope="col" className="num">Residuo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.points.map((point, index) => (
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
            </div>
          </div>

          <Callout tone="info" title="¿Cómo se interpreta?">
            El modelo estima que {yVariable.label.toLowerCase()} cambia en{" "}
            {formatNumber(result.slope, 3)} {yVariable.unit ?? "unidades"} por cada unidad de{" "}
            {xVariable.label.toLowerCase()}. R² = {formatNumber(result.r2, 3)} indica la proporción de
            variabilidad de Y asociada linealmente con X. Es un resumen de la muestra visible, no una
            prueba de causalidad ni una promesa de predicción fuera del rango observado.
          </Callout>
        </div>
      )}
    </Card>
  );
}

export function Inference() {
  const { state, filteredRows, resetFilters } = useApp();

  return (
    <section id="pruebas" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="06"
        icon={FlaskConical}
        title="Pruebas estadísticas"
        description="Contrastes de independencia y modelos de asociación lineal. Cada resultado incluye hipótesis, supuestos, decisión y límites."
        aside={<Badge tone="accent">α = {state.alpha}</Badge>}
      />

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No hay datos para las pruebas"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar la base y calcular los contrastes."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="space-y-5">
          <ChiSquareCard />
          <CorrelationCard />
          <RegressionCard />
          <Callout tone="warning" title="Límite común a los tres procedimientos" icon={Info}>
            Los resultados describen una muestra sintética. No prueban causalidad, no estiman el
            efecto de una intervención y no se generalizan a estudiantes reales. La significación
            estadística tampoco garantiza relevancia práctica.
          </Callout>
        </div>
      )}
    </section>
  );
}
