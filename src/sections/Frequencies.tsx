import { ListOrdered, SlidersHorizontal } from "lucide-react";
import { useApp } from "../state/AppContext";
import {
  QUALITATIVE_VARIABLES,
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
} from "../data/schema";
import type { QualitativeKey, QuantitativeKey } from "../data/types";
import { categoricalFrequency, groupedFrequency, sturgesBins } from "../stats/frequency";
import { formatInterval, formatNumber, formatPercent } from "../lib/format";
import {
  Badge,
  Callout,
  Card,
  EmptyState,
  ResetFiltersButton,
  SectionHeader,
  SegmentedControl,
  SelectField,
} from "../components/ui";

export function Frequencies() {
  const { state, filteredRows, resetFilters, setSelection } = useApp();
  const selections = state.selections;
  const qualitativeKey = selections.freqQualitative;
  const quantitativeKey = selections.freqQuantitative;

  const qualitativeValues = filteredRows.map((row) => getCategoricalValue(row, qualitativeKey));
  const categoryOrder = getCategories(qualitativeKey);
  const qualitative = categoricalFrequency(qualitativeValues, {
    order: categoryOrder,
    includeZero: true,
  });
  const isOrdinal = VARIABLE_MAP[qualitativeKey].type === "ordinal";

  const quantitativeValues = filteredRows.map((row) => row[quantitativeKey]);
  const grouped = groupedFrequency(quantitativeValues, selections.bins === 0 ? undefined : selections.bins);
  const suggestedBins = sturgesBins(filteredRows.length);

  const topCategory = [...qualitative.rows].sort((a, b) => b.count - a.count)[0];
  const topInterval = [...grouped.rows].sort((a, b) => b.count - a.count)[0];

  return (
    <section id="frecuencias" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="04"
        icon={ListOrdered}
        title="Distribuciones de frecuencia"
        description="Cuántos casos hay en cada categoría o intervalo, qué proporción representan y cómo se acumulan. Todo se calcula sobre las filas visibles."
        aside={<Badge tone="accent">n = {filteredRows.length}</Badge>}
      />

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No hay datos para resumir"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar la base y sus distribuciones."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    <ListOrdered aria-hidden="true" size={13} />
                    Variable cualitativa
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-fg">Conteo por categoría</h3>
                </div>
                <SegmentedControl
                  label="Tipo de distribución"
                  value={selections.freqMode}
                  onChange={(value) => setSelection("freqMode", value)}
                  options={[
                    { value: "qualitative", label: "Cualitativa" },
                    { value: "quantitative", label: "Agrupada" },
                  ]}
                />
              </div>

              {selections.freqMode === "qualitative" ? (
                <>
                  <SelectField
                    label="Variable"
                    value={qualitativeKey}
                    onChange={(value) => setSelection("freqQualitative", value as QualitativeKey)}
                    options={QUALITATIVE_VARIABLES.map((variable) => ({
                      value: variable.key,
                      label: variable.label,
                    }))}
                  />

                  <div className="table-wrap max-h-[24rem] overflow-auto">
                    <table className="data-table">
                      <caption className="sr-only">
                        Distribución de frecuencia de {VARIABLE_MAP[qualitativeKey].label}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Categoría</th>
                          <th scope="col" className="num">
                            f
                          </th>
                          <th scope="col" className="num">
                            fr
                          </th>
                          <th scope="col" className="num">
                            %
                          </th>
                          {isOrdinal ? (
                            <>
                              <th scope="col" className="num">
                                F
                              </th>
                              <th scope="col" className="num">
                                F%
                              </th>
                            </>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {qualitative.rows.map((row) => (
                          <tr key={row.value}>
                            <td>{row.value}</td>
                            <td className="num">{row.count}</td>
                            <td className="num">{formatNumber(row.relative, 3)}</td>
                            <td className="num">{formatPercent(row.percent)}</td>
                            {isOrdinal ? (
                              <>
                                <td className="num">{row.cumulative}</td>
                                <td className="num">{formatPercent(row.cumulativePercent)}</td>
                              </>
                            ) : null}
                          </tr>
                        ))}
                        <tr className="bg-surface-2 font-semibold">
                          <td>Total</td>
                          <td className="num">{qualitative.total}</td>
                          <td className="num">{formatNumber(1, 3)}</td>
                          <td className="num">{formatPercent(100)}</td>
                          {isOrdinal ? (
                            <>
                              <td className="num">{qualitative.total}</td>
                              <td className="num">{formatPercent(100)}</td>
                            </>
                          ) : null}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[0.7rem] leading-relaxed text-faint">
                    {isOrdinal
                      ? "La variable es ordinal, por eso las frecuencias acumuladas tienen sentido."
                      : "La variable es nominal: las categorías no tienen orden natural, así que no se muestran frecuencias acumuladas."}
                  </p>

                  <Callout tone="info" title="¿Cómo se interpreta?">
                    La categoría más frecuente es <strong className="text-fg">{topCategory?.value}</strong>{" "}
                    con {topCategory?.count ?? 0} casos ({formatPercent(topCategory?.percent ?? 0)}). La
                    frecuencia relativa es la proporción dentro del total; la porcentual multiplica esa
                    proporción por 100. En una nominal no se acumula porque sumar “Laptop + Tablet” no
                    tiene una interpretación ordenada.
                  </Callout>
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Variable cuantitativa"
                      value={quantitativeKey}
                      onChange={(value) => setSelection("freqQuantitative", value as QuantitativeKey)}
                      options={QUANTITATIVE_VARIABLES.map((variable) => ({
                        value: variable.key,
                        label: variable.label,
                      }))}
                    />
                    <SelectField
                      label="Intervalos"
                      value={String(selections.bins)}
                      onChange={(value) => setSelection("bins", Number(value))}
                      options={[
                        { value: "0", label: `Automático (Sturges: ${suggestedBins})` },
                        ...Array.from({ length: 10 }, (_, index) => index + 3).map((bins) => ({
                          value: String(bins),
                          label: `${bins} intervalos`,
                        })),
                      ]}
                      hint="La regla de Sturges sugiere un número inicial de clases."
                    />
                  </div>

                  <div className="table-wrap max-h-[24rem] overflow-auto">
                    <table className="data-table">
                      <caption className="sr-only">
                        Distribución agrupada de {VARIABLE_MAP[quantitativeKey].label}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Intervalo</th>
                          <th scope="col" className="num">
                            Marca
                          </th>
                          <th scope="col" className="num">
                            f
                          </th>
                          <th scope="col" className="num">
                            fr
                          </th>
                          <th scope="col" className="num">
                            %
                          </th>
                          <th scope="col" className="num">
                            F
                          </th>
                          <th scope="col" className="num">
                            F%
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped.rows.map((row) => (
                          <tr key={`${row.lower}-${row.upper}`}>
                            <td className="whitespace-nowrap">
                              {grouped.constant
                                ? formatNumber(row.lower, 1)
                                : formatInterval(row.lower, row.upper)}
                            </td>
                            <td className="num">{formatNumber(row.mark, 1)}</td>
                            <td className="num">{row.count}</td>
                            <td className="num">{formatNumber(row.relative, 3)}</td>
                            <td className="num">{formatPercent(row.percent)}</td>
                            <td className="num">{row.cumulative}</td>
                            <td className="num">{formatPercent(row.cumulativePercent)}</td>
                          </tr>
                        ))}
                        <tr className="bg-surface-2 font-semibold">
                          <td>Total</td>
                          <td className="num">—</td>
                          <td className="num">{grouped.total}</td>
                          <td className="num">{formatNumber(1, 3)}</td>
                          <td className="num">{formatPercent(100)}</td>
                          <td className="num">{grouped.total}</td>
                          <td className="num">{formatPercent(100)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[0.7rem] leading-relaxed text-faint">
                    {grouped.constant
                      ? "Todos los valores son iguales: solo existe un intervalo."
                      : `Ancho de clase: ${formatNumber(grouped.width, 2)}. Los intervalos son de la forma [límite inferior, límite superior). La marca de clase es el punto medio y se usa para resumir el intervalo.`}
                  </p>

                  <Callout tone="info" title="¿Cómo se interpreta?">
                    {grouped.constant ? (
                      <>Todos los datos visibles toman el mismo valor, por eso el histograma se reduce a una sola clase.</>
                    ) : (
                      <>
                        El intervalo con mayor frecuencia es{" "}
                        <strong className="text-fg">
                          {formatInterval(topInterval?.lower ?? 0, topInterval?.upper ?? 0)}
                        </strong>{" "}
                        con {topInterval?.count ?? 0} casos ({formatPercent(topInterval?.percent ?? 0)}).
                        La columna F acumula casos de menor a mayor; F% hace lo mismo con porcentajes.
                        La marca de clase resume el intervalo, pero no recupera los valores individuales.
                      </>
                    )}
                  </Callout>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  <SlidersHorizontal aria-hidden="true" size={13} />
                  Lectura
                </p>
                <h3 className="mt-1 text-base font-semibold text-fg">Qué mirar en una tabla de frecuencias</h3>
              </div>
              <Badge tone="neutral">n = {filteredRows.length}</Badge>
            </div>

            <dl className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <dt className="font-semibold text-fg">Frecuencia absoluta (f)</dt>
                <dd className="mt-1 text-muted">Número de casos en la categoría o intervalo. La suma de todas las f debe ser igual a n.</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <dt className="font-semibold text-fg">Frecuencia relativa (fr)</dt>
                <dd className="mt-1 text-muted">Proporción del total: f / n. Sirve para comparar muestras de distinto tamaño.</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <dt className="font-semibold text-fg">Porcentaje (%)</dt>
                <dd className="mt-1 text-muted">fr × 100. Los porcentajes pueden no sumar exactamente 100 por redondeo.</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <dt className="font-semibold text-fg">Frecuencia acumulada (F)</dt>
                <dd className="mt-1 text-muted">Suma de las frecuencias hasta esa categoría. Solo se interpreta cuando la variable tiene orden.</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs leading-relaxed text-muted">
                Una tabla de frecuencias describe, no explica. Si una categoría aparece más, no
                significa que cause el rendimiento observado.
              </p>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
