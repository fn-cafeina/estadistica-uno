import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  FlaskConical,
  Info,
} from "lucide-react";
import { useLab } from "../LabContext";
import { CHI_PAIRS, getChiPair, type ChiPairId } from "../chiPairs";
import { firstProcedure } from "../navigation";
import {
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
  getVariableLabel,
} from "../../data/schema";
import type { QuantitativeKey } from "../../data/types";
import { chiSquareTest } from "../../stats/chiSquare";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression, predictValue } from "../../stats/regression";
import {
  correlationText,
  formatEquation,
  formatNumber,
  formatPValue,
  formatPercent,
  pDecisionText,
} from "../../lib/format";
import {
  Section,
  Panel,
  Metric,
  Badge,
  Button,
  SelectField,
  SegmentedControl,
  Interpretation,
  Callout,
  TableWrap,
  EmptyState,
  ResetFiltersButton,
  ProcedureTabs,
} from "../components";

function cramersStrength(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "No calculable";
  if (value < 0.1) return "Asociación negligible";
  if (value < 0.3) return "Asociación baja";
  if (value < 0.5) return "Asociación moderada";
  return "Asociación alta";
}

export function Tests({ procedure }: { procedure: string | null }) {
  const active = procedure ?? firstProcedure("pruebas");
  const { filteredRows, resetFilters } = useLab();
  const [chiPairId, setChiPairId] = useState<ChiPairId>("usage");
  const [alpha, setAlpha] = useState(0.05);
  const [showExpected, setShowExpected] = useState(false);
  const [corrX, setCorrX] = useState<QuantitativeKey>("studyHours");
  const [corrY, setCorrY] = useState<QuantitativeKey>("gpa");
  const [regX, setRegX] = useState<QuantitativeKey>("studyHours");
  const [regY, setRegY] = useState<QuantitativeKey>("gpa");
  const [predictionInput, setPredictionInput] = useState("");

  const chiPair = getChiPair(chiPairId);
  const chiResult = useMemo(() => {
    const pairs = filteredRows.map((row) => ({
      row: getCategoricalValue(row, chiPair.rowKey),
      col: getCategoricalValue(row, chiPair.colKey),
    }));
    return chiSquareTest(
      pairs,
      getCategories(chiPair.rowKey),
      getCategories(chiPair.colKey),
      alpha,
    );
  }, [alpha, chiPair.colKey, chiPair.rowKey, filteredRows]);

  const correlation = pearsonCorrelation(
    filteredRows.map((row) => row[corrX]),
    filteredRows.map((row) => row[corrY]),
  );
  const regression = linearRegression(
    filteredRows.map((row) => row[regX]),
    filteredRows.map((row) => row[regY]),
  );
  const xVariable = VARIABLE_MAP[corrX];
  const yVariable = VARIABLE_MAP[corrY];
  const regXVariable = VARIABLE_MAP[regX];
  const regYVariable = VARIABLE_MAP[regY];
  const parsedPrediction = Number(predictionInput);
  const hasPrediction = predictionInput.trim() !== "" && Number.isFinite(parsedPrediction);
  const predicted = regression && hasPrediction ? predictValue(regression, parsedPrediction) : null;
  const outsideRange =
    regression && hasPrediction
      ? parsedPrediction < regression.xMin || parsedPrediction > regression.xMax
      : false;

  const changeCorrX = (value: QuantitativeKey) => {
    if (value === corrY) setCorrY(corrX);
    setCorrX(value);
  };
  const changeCorrY = (value: QuantitativeKey) => {
    if (value === corrX) setCorrX(corrY);
    setCorrY(value);
  };
  const swapCorr = () => {
    setCorrX(corrY);
    setCorrY(corrX);
  };
  const changeRegX = (value: QuantitativeKey) => {
    if (value === regY) setRegY(regX);
    setRegX(value);
  };
  const changeRegY = (value: QuantitativeKey) => {
    if (value === regX) setRegX(regY);
    setRegY(value);
  };
  const swapReg = () => {
    setRegX(regY);
    setRegY(regX);
  };

  return (
    <Section
      id="pruebas"
      title={<>Qué se puede <em>sostener</em>.</>}
      description="Contrastes de independencia y modelos de asociación lineal. Cada resultado incluye hipótesis, supuestos, decisión y límites."
      aside={<Badge tone="accent">α = {alpha}</Badge>}
    >
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No hay datos para las pruebas"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para calcular los contrastes."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="space-y-6">
          <ProcedureTabs section="pruebas" active={active} />
          <Panel title="Chi-cuadrado" meta={chiPair.label} active={active === "chi2"}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Par de variables"
                value={chiPairId}
                onChange={(value) => setChiPairId(value as ChiPairId)}
                options={CHI_PAIRS.map((pair) => ({ value: pair.id, label: pair.shortLabel }))}
              />
              <SelectField
                label="Nivel de significación"
                value={String(alpha)}
                onChange={(value) => setAlpha(Number(value))}
                options={[
                  { value: "0.01", label: "α = 0.01" },
                  { value: "0.05", label: "α = 0.05" },
                  { value: "0.10", label: "α = 0.10" },
                ]}
              />
              <div className="flex items-end">
                <SegmentedControl
                  label="Tipo de frecuencia"
                  value={showExpected ? "expected" : "observed"}
                  onChange={(value) => setShowExpected(value === "expected")}
                  options={[
                    { value: "observed", label: "Observadas" },
                    { value: "expected", label: "Esperadas" },
                  ]}
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">{chiPair.description}</p>

            {chiResult ? (
              <>
                <div className="lab-metrics mt-4">
                  <Metric label="χ²" value={formatNumber(chiResult.statistic, 2)} hint="Estadístico observado" accent />
                  <Metric label="Grados de libertad" value={chiResult.degreesOfFreedom} hint="(filas − 1)(columnas − 1)" />
                  <Metric label="Valor p" value={formatPValue(chiResult.pValue)} hint={`α = ${alpha}`} />
                  <Metric label="Cramér's V" value={formatNumber(chiResult.cramersV, 2)} hint={cramersStrength(chiResult.cramersV)} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="lab-slab">
                    <p className="lab-label">Hipótesis nula</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      H₀: {getVariableLabel(chiPair.rowKey)} y {getVariableLabel(chiPair.colKey)} son
                      independientes.
                    </p>
                  </div>
                  <div className="lab-slab lab-slab-warning">
                    <p className="lab-label">Hipótesis alternativa</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      H₁: existe asociación entre {getVariableLabel(chiPair.rowKey)} y{" "}
                      {getVariableLabel(chiPair.colKey)}.
                    </p>
                  </div>
                </div>

                <TableWrap className="mt-4 max-h-[28rem] overflow-auto" hint="Desliza para ver todas las columnas.">
                  <table className="lab-table min-w-[32rem]">
                    <caption className="sr-only">
                      Tabla de contingencia de {getVariableLabel(chiPair.rowKey)} y{" "}
                      {getVariableLabel(chiPair.colKey)}.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{getVariableLabel(chiPair.rowKey)}</th>
                        {chiResult.colCategories.map((category) => (
                          <th key={category} scope="col" className="num">
                            {category}
                          </th>
                        ))}
                        <th scope="col" className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiResult.rowCategories.map((rowCategory, rowIndex) => (
                        <tr key={rowCategory}>
                          <td className="font-medium text-fg">{rowCategory}</td>
                          {chiResult.colCategories.map((colCategory, colIndex) => {
                            const value = showExpected
                              ? (chiResult.expected[rowIndex]?.[colIndex] ?? 0)
                              : (chiResult.observed[rowIndex]?.[colIndex] ?? 0);
                            const low = showExpected && value < 5;
                            return (
                              <td key={colCategory} className={low ? "num text-warning" : "num"}>
                                {showExpected ? formatNumber(value, 1) : value}
                              </td>
                            );
                          })}
                          <td className="num font-semibold">{chiResult.rowTotals[rowIndex]}</td>
                        </tr>
                      ))}
                      <tr className="row-total">
                        <td>Total</td>
                        {chiResult.colTotals.map((total, index) => (
                          <td key={`${chiResult.colCategories[index] ?? index}-total`} className="num">
                            {total}
                          </td>
                        ))}
                        <td className="num">{chiResult.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </TableWrap>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <Callout
                    title={chiResult.cellsBelow5 > 0 ? "Revisar supuestos" : "Supuesto de frecuencias esperadas"}
                    tone={chiResult.cellsBelow5 > 0 ? "warning" : "success"}
                    icon={chiResult.cellsBelow5 > 0 ? AlertTriangle : CheckCircle2}
                  >
                    {chiResult.cellsBelow5 > 0 ? (
                      <>
                        {chiResult.cellsBelow5} de {chiResult.totalCells} celdas tienen esperado menor
                        que 5 (mínimo {formatNumber(chiResult.minExpected, 2)}). La aproximación puede
                        ser inestable. Interpreta el valor p con cautela.
                      </>
                    ) : (
                      <>Todas las frecuencias esperadas son al menos 5.</>
                    )}
                    {chiResult.omittedRowCategories.length + chiResult.omittedColCategories.length > 0 ? (
                      <span className="mt-1 block">
                        Categorías omitidas por no tener observaciones:{" "}
                        {[...chiResult.omittedRowCategories, ...chiResult.omittedColCategories].join(", ")}.
                      </span>
                    ) : null}
                  </Callout>

                  <Callout
                    title={
                      chiResult.rejectNull
                        ? "Se rechaza la hipótesis nula"
                        : "No se rechaza la hipótesis nula"
                    }
                    tone={chiResult.rejectNull ? "success" : "info"}
                    icon={chiResult.rejectNull ? CheckCircle2 : Info}
                  >
                    {pDecisionText(chiResult.pValue, alpha)} Cramér's V ={" "}
                    {formatNumber(chiResult.cramersV, 2)}:{" "}
                    {cramersStrength(chiResult.cramersV).toLowerCase()}. La prueba detecta asociación,
                    no dirección ni causalidad.
                  </Callout>
                </div>

                <div className="mt-3">
                  <Interpretation>
                    <p>
                      χ² mide cuánto se alejan las frecuencias observadas de las esperadas si las
                      variables fueran independientes. Un estadístico grande y un valor p pequeño
                      sugieren asociación. Los grados de libertad dependen del número de filas y
                      columnas.
                    </p>
                  </Interpretation>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <Callout title="No se puede calcular la prueba" tone="warning" icon={AlertTriangle}>
                  Se necesitan al menos dos categorías en cada variable y datos suficientes después de
                  los filtros.
                </Callout>
              </div>
            )}
          </Panel>

          <Panel title="Correlación de Pearson" meta="Asociación lineal" active={active === "pearson"}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
              <SelectField
                label="Variable X"
                value={corrX}
                onChange={(value) => changeCorrX(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              />
              <SelectField
                label="Variable Y"
                value={corrY}
                onChange={(value) => changeCorrY(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              />
              <div className="flex items-end">
                <Button icon={ArrowLeftRight} onClick={swapCorr}>
                  Cambiar X e Y
                </Button>
              </div>
            </div>

            {correlation ? (
              <>
                <div className="lab-metrics mt-4">
                  <Metric label="r" value={formatNumber(correlation.r, 3)} hint={`${correlation.strength}, ${correlation.direction}`} accent />
                  <Metric label="R²" value={formatNumber(correlation.r2, 3)} hint={`${formatPercent(correlation.r2 * 100)} de variabilidad`} />
                  <Metric label="Pares válidos" value={correlation.n} hint="Observaciones completas" />
                  <Metric label="Valor p" value={formatPValue(correlation.pValue)} hint="Prueba bilateral" />
                </div>
                <div className="lab-formula mt-4">
                  r = Σ[(xᵢ − x̄)(yᵢ − ȳ)] / √[Σ(xᵢ − x̄)² · Σ(yᵢ − ȳ)²]
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                  <Interpretation>
                    <p>
                      {correlationText(correlation.r, correlation.strength, correlation.direction)} r² ={" "}
                      {formatNumber(correlation.r2, 3)} indica que aproximadamente{" "}
                      {formatPercent(correlation.r2 * 100)} de la variabilidad de {yVariable.label.toLowerCase()}{" "}
                      se asocia linealmente con {xVariable.label.toLowerCase()} en esta muestra.
                    </p>
                  </Interpretation>
                  <Callout title="Correlación no implica causalidad" tone="warning" icon={AlertTriangle}>
                    Dos variables pueden moverse juntas sin que una cause a la otra. Pearson solo
                    detecta relaciones lineales y es sensible a valores extremos.
                  </Callout>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <Callout title="No se puede calcular la correlación" tone="warning" icon={AlertTriangle}>
                  Se necesitan al menos tres pares válidos y variabilidad en ambas variables.
                </Callout>
              </div>
            )}
          </Panel>

          <Panel
            title="Regresión lineal simple"
            meta="Modelo de mínimos cuadrados"
            active={active === "regresion"}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
              <SelectField
                label="Variable X"
                value={regX}
                onChange={(value) => changeRegX(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              />
              <SelectField
                label="Variable Y"
                value={regY}
                onChange={(value) => changeRegY(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({ value: variable.key, label: variable.label }))}
              />
              <div className="flex items-end">
                <Button icon={ArrowLeftRight} onClick={swapReg}>
                  Cambiar X e Y
                </Button>
              </div>
            </div>

            {regression ? (
              <>
                <div className="lab-metrics mt-4">
                  <Metric label="Pendiente" value={formatNumber(regression.slope, 3)} hint={`${regYVariable.unit ?? "unidades"} por ${regXVariable.unit ?? "unidad"}`} accent />
                  <Metric label="Intercepto" value={formatNumber(regression.intercept, 2)} hint="Valor estimado cuando X = 0" />
                  <Metric label="R²" value={formatNumber(regression.r2, 3)} hint={`${formatPercent(regression.r2 * 100)} de variabilidad`} />
                  <Metric label="Error típico" value={formatNumber(regression.standardError, 2)} hint={`n = ${regression.n}`} />
                </div>

                <div className="lab-formula mt-4">
                  {formatEquation(regression.slope, regression.intercept, regXVariable.label, regYVariable.label)}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="lab-label">Predicción</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Rango observado de X: {formatNumber(regression.xMin, 1)} a{" "}
                      {formatNumber(regression.xMax, 1)} {regXVariable.unit ?? ""}. Predice solo dentro
                      de ese intervalo.
                    </p>
                    <label className="mt-3 block">
                      <span className="lab-form-label">Valor de {regXVariable.label}</span>
                      <input
                        type="number"
                        className="lab-field"
                        step="any"
                        placeholder={`Entre ${formatNumber(regression.xMin, 1)} y ${formatNumber(regression.xMax, 1)}`}
                        value={predictionInput}
                        onChange={(event) => setPredictionInput(event.target.value)}
                      />
                    </label>
                    {hasPrediction && predicted !== null ? (
                      <div
                        className={
                          outsideRange
                            ? "mt-3 border border-warning bg-warning/10 p-3"
                            : "mt-3 border border-success bg-success/10 p-3"
                        }
                      >
                        <p className="text-xs text-muted">Predicción estimada</p>
                        <p className="mt-1 text-xl font-semibold text-fg">
                          {formatNumber(predicted, 1)} {regYVariable.unit ?? ""}
                        </p>
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                          {outsideRange
                            ? "Fuera del rango observado. Es una extrapolación y debe tomarse con cautela."
                            : "Dentro del rango observado. Es una estimación media, no una garantía individual."}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-[0.7rem] text-faint">
                        Escribe un valor de X para obtener la estimación de Y.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="lab-label">Observados y estimados</p>
                    <TableWrap className="mt-2 max-h-72 overflow-auto" hint="Desliza para ver todas las columnas.">
                      <table className="lab-table">
                        <caption className="sr-only">Valores observados, estimados y residuos</caption>
                        <thead>
                          <tr>
                            <th scope="col" className="num">{regXVariable.label}</th>
                            <th scope="col" className="num">{regYVariable.label} observado</th>
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
                    </TableWrap>
                  </div>
                </div>

                <div className="mt-4">
                  <Interpretation>
                    <p>
                      El modelo estima que {regYVariable.label.toLowerCase()} cambia en{" "}
                      {formatNumber(regression.slope, 3)} {regYVariable.unit ?? "unidades"} por cada
                      unidad de {regXVariable.label.toLowerCase()}. R² ={" "}
                      {formatNumber(regression.r2, 3)} indica la proporción de variabilidad de Y
                      asociada linealmente con X. Es un resumen de la muestra, no una prueba de
                      causalidad ni una promesa de predicción fuera del rango observado.
                    </p>
                  </Interpretation>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <Callout title="No se puede ajustar la recta" tone="warning" icon={AlertTriangle}>
                  Se necesitan al menos tres pares válidos y variabilidad en X e Y.
                </Callout>
              </div>
            )}
          </Panel>

        </div>
      )}
    </Section>
  );
}
