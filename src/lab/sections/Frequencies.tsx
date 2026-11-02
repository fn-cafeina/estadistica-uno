import { ListOrdered, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useLab } from "../LabContext";
import {
  QUALITATIVE_VARIABLES,
  QUANTITATIVE_VARIABLES,
  VARIABLE_MAP,
  getCategories,
  getCategoricalValue,
} from "../../data/schema";
import type { QualitativeKey, QuantitativeKey } from "../../data/types";
import { categoricalFrequency, groupedFrequency, sturgesBins } from "../../stats/frequency";
import { formatInterval, formatNumber, formatPercent } from "../../lib/format";
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

export function Frequencies() {
  const { filteredRows, resetFilters } = useLab();
  const [qualitativeKey, setQualitativeKey] = useState<QualitativeKey>("major");
  const [quantitativeKey, setQuantitativeKey] = useState<QuantitativeKey>("screenHours");
  const [bins, setBins] = useState(0);

  const qualitativeValues = filteredRows.map((row) => getCategoricalValue(row, qualitativeKey));
  const qualitative = categoricalFrequency(qualitativeValues, {
    order: getCategories(qualitativeKey),
    includeZero: true,
  });
  const isOrdinal = VARIABLE_MAP[qualitativeKey].type === "ordinal";
  const topCategory = [...qualitative.rows].sort((a, b) => b.count - a.count)[0];

  const quantitativeValues = filteredRows.map((row) => row[quantitativeKey]);
  const grouped = groupedFrequency(quantitativeValues, bins === 0 ? undefined : bins);
  const suggestedBins = sturgesBins(filteredRows.length);
  const topInterval = [...grouped.rows].sort((a, b) => b.count - a.count)[0];
  const qualitativeVariable = VARIABLE_MAP[qualitativeKey];
  const quantitativeVariable = VARIABLE_MAP[quantitativeKey];

  return (
    <Section
      id="frecuencias"
      title={<>Cómo se reparten los <em>datos</em>.</>}
      description="Frecuencias absolutas, relativas y porcentuales. Para variables ordinales y datos agrupados se agregan las frecuencias acumuladas."
      aside={<Badge tone="accent">n = {filteredRows.length}</Badge>}
    >
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No hay datos para resumir"
          description="Los filtros globales dejaron la muestra vacía. Limpia los filtros para recuperar la base."
          action={<ResetFiltersButton onClick={resetFilters} />}
        />
      ) : (
        <div className="lab-grid lab-grid-2">
          <Panel title="Variable cualitativa" meta="Conteo por categoría">
            <SelectField
              label="Variable"
              value={qualitativeKey}
              onChange={(value) => setQualitativeKey(value as QualitativeKey)}
              options={QUALITATIVE_VARIABLES.map((variable) => ({
                value: variable.key,
                label: variable.label,
              }))}
            />

            <TableWrap className="mt-4 max-h-[24rem] overflow-auto" hint="Desliza para ver todas las columnas.">
              <table className="lab-table">
                <caption className="sr-only">Distribución de frecuencia de {qualitativeVariable.label}</caption>
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col" className="num">f</th>
                    <th scope="col" className="num">fr</th>
                    <th scope="col" className="num">%</th>
                    {isOrdinal ? (
                      <>
                        <th scope="col" className="num">F</th>
                        <th scope="col" className="num">F%</th>
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
                  <tr className="row-total">
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
            </TableWrap>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              {isOrdinal
                ? "La variable es ordinal, por eso las frecuencias acumuladas tienen sentido."
                : "La variable es nominal: las categorías no tienen orden natural, así que no se muestran frecuencias acumuladas."}
            </p>

            <div className="mt-4">
              <Interpretation>
                <p>
                  La categoría más frecuente es <strong className="text-fg">{topCategory?.value ?? "s/d"}</strong>{" "}
                  con {topCategory?.count ?? 0} casos ({formatPercent(topCategory?.percent ?? 0)}). La
                  frecuencia relativa es la proporción dentro del total; la porcentual la multiplica
                  por 100. La suma de las frecuencias absolutas debe ser exactamente n.
                </p>
              </Interpretation>
            </div>
          </Panel>

          <Panel title="Variable cuantitativa agrupada" meta="Intervalos y marcas de clase">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Variable"
                value={quantitativeKey}
                onChange={(value) => setQuantitativeKey(value as QuantitativeKey)}
                options={QUANTITATIVE_VARIABLES.map((variable) => ({
                  value: variable.key,
                  label: variable.label,
                }))}
              />
              <SelectField
                label="Intervalos"
                value={String(bins)}
                onChange={(value) => setBins(Number(value))}
                options={[
                  { value: "0", label: `Automático (Sturges: ${suggestedBins})` },
                  ...Array.from({ length: 10 }, (_, index) => index + 3).map((count) => ({
                    value: String(count),
                    label: `${count} intervalos`,
                  })),
                ]}
              />
            </div>

            <TableWrap className="mt-4 max-h-[24rem] overflow-auto" hint="Desliza para ver todas las columnas.">
              <table className="lab-table">
                <caption className="sr-only">Distribución agrupada de {quantitativeVariable.label}</caption>
                <thead>
                  <tr>
                    <th scope="col">Intervalo</th>
                    <th scope="col" className="num">Marca</th>
                    <th scope="col" className="num">f</th>
                    <th scope="col" className="num">fr</th>
                    <th scope="col" className="num">%</th>
                    <th scope="col" className="num">F</th>
                    <th scope="col" className="num">F%</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.rows.map((row) => (
                    <tr key={`${row.lower}-${row.upper}`}>
                      <td className="whitespace-nowrap">
                        {grouped.constant ? formatNumber(row.lower, 1) : formatInterval(row.lower, row.upper)}
                      </td>
                      <td className="num">{formatNumber(row.mark, 1)}</td>
                      <td className="num">{row.count}</td>
                      <td className="num">{formatNumber(row.relative, 3)}</td>
                      <td className="num">{formatPercent(row.percent)}</td>
                      <td className="num">{row.cumulative}</td>
                      <td className="num">{formatPercent(row.cumulativePercent)}</td>
                    </tr>
                  ))}
                  <tr className="row-total">
                    <td>Total</td>
                    <td className="num">s/d</td>
                    <td className="num">{grouped.total}</td>
                    <td className="num">{formatNumber(1, 3)}</td>
                    <td className="num">{formatPercent(100)}</td>
                    <td className="num">{grouped.total}</td>
                    <td className="num">{formatPercent(100)}</td>
                  </tr>
                </tbody>
              </table>
            </TableWrap>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              {grouped.constant
                ? "Todos los valores son iguales: solo existe un intervalo."
                : `Ancho de clase: ${formatNumber(grouped.width, 2)}. Los intervalos son de la forma [límite inferior, límite superior). La marca es el punto medio.`}
            </p>

            <div className="mt-4">
              <Interpretation>
                {grouped.constant ? (
                  <p>Todos los datos visibles toman el mismo valor, por eso solo hay una clase.</p>
                ) : (
                  <p>
                    El intervalo con mayor frecuencia es{" "}
                    <strong className="text-fg">
                      {formatInterval(topInterval?.lower ?? 0, topInterval?.upper ?? 0)}
                    </strong>{" "}
                    con {topInterval?.count ?? 0} casos ({formatPercent(topInterval?.percent ?? 0)}). La
                    columna F acumula casos de menor a mayor; F% hace lo mismo con porcentajes. La marca
                    de clase resume el intervalo, pero no recupera los valores individuales.
                  </p>
                )}
              </Interpretation>
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Callout title="f y fr">
          <p>La frecuencia absoluta cuenta casos. La relativa los divide por n y permite comparar muestras de distinto tamaño.</p>
        </Callout>
        <Callout title="Porcentaje">
          <p>Es la frecuencia relativa multiplicada por 100. Por redondeo, la suma puede no dar exactamente 100.</p>
        </Callout>
        <Callout title="Acumuladas">
          <p>F y F% solo se interpretan cuando la variable tiene orden. En una nominal, acumular no tiene sentido.</p>
        </Callout>
      </div>

      <div className="mt-4 flex items-center gap-2 text-faint">
        <SlidersHorizontal aria-hidden="true" size={13} />
        <span className="text-label">Cambia la variable o los intervalos para actualizar las tablas.</span>
      </div>
    </Section>
  );
}
