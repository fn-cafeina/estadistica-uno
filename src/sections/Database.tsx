import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database as DatabaseIcon,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import {
  ACADEMIC_YEARS,
  MAJORS,
  SAMPLE_SIZES,
  SEXES,
  type AcademicYear,
  type Major,
  type SampleSize,
  type Sex,
  type StudentRecord,
  type VariableKey,
} from "../data/types";
import { VARIABLE_MAP, VARIABLES, formatCategoricalValue } from "../data/schema";
import { formatDate, formatNumber } from "../lib/format";
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  ResetFiltersButton,
  SectionHeader,
  SelectField,
} from "../components/ui";

type SortKey = "id" | VariableKey;
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50] as const;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function cellValue(record: StudentRecord, key: SortKey): string {
  if (key === "id") return String(record.id);
  const variable = VARIABLE_MAP[key];
  const raw = record[key];

  if (variable.type === "nominal" || variable.type === "ordinal") {
    return key === "year" ? formatCategoricalValue("year", String(raw)) : String(raw);
  }

  return formatNumber(raw as number, variable.type === "discrete" ? 0 : 1);
}

function rawValue(record: StudentRecord, key: SortKey): string | number {
  if (key === "id") return record.id;
  const value = record[key];
  return typeof value === "number" ? value : String(value);
}

export function Database() {
  const {
    state,
    filteredRows,
    activeFilterCount,
    regenerate,
    resetFilters,
    setFilter,
    setSampleSize,
    exportCsv,
  } = useApp();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "id",
    direction: "asc",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setPage(0);
  }, [filteredRows, deferredSearch, sort, pageSize, state.printing]);

  const searchedRows = useMemo(() => {
    const term = normalizeText(deferredSearch.trim());
    if (!term) return filteredRows;
    return filteredRows.filter((row) => normalizeText(Object.values(row).join(" ")).includes(term));
  }, [filteredRows, deferredSearch]);

  const sortedRows = useMemo(() => {
    const copy = [...searchedRows];
    copy.sort((a, b) => {
      const left = rawValue(a, sort.key);
      const right = rawValue(b, sort.key);
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "es", { sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [searchedRows, sort]);

  const pages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const pageRows = sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const displayRows = state.printing ? sortedRows : pageRows;
  const rangeStart = sortedRows.length === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min(sortedRows.length, (currentPage + 1) * pageSize);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: "major" | "sex" | "year"; label: string; value: string }> = [];
    if (state.filters.major !== "all") {
      items.push({ key: "major", label: "Carrera", value: state.filters.major });
    }
    if (state.filters.sex !== "all") {
      items.push({ key: "sex", label: "Sexo", value: state.filters.sex });
    }
    if (state.filters.year !== "all") {
      items.push({ key: "year", label: "Año", value: `${state.filters.year}.º` });
    }
    return items;
  }, [state.filters]);

  const changeSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const clearFilter = (key: "major" | "sex" | "year") => {
    if (key === "major") setFilter("major", "all");
    if (key === "sex") setFilter("sex", "all");
    if (key === "year") setFilter("year", "all");
  };

  const columns: Array<{ key: SortKey; label: string; unit: string | null }> = [
    { key: "id", label: "ID", unit: null },
    ...VARIABLES.map((variable) => ({
      key: variable.key,
      label: variable.label,
      unit: variable.unit,
    })),
  ];

  return (
    <section id="base-datos" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="03"
        icon={DatabaseIcon}
        title="Base de datos interactiva"
        description="Ordena, busca y filtra la muestra. Los filtros de esta sección afectan todos los análisis de la aplicación, no solo la tabla."
        aside={
          <Badge tone={filteredRows.length === state.sample.n ? "accent" : "warning"}>
            {filteredRows.length} de {state.sample.n} registros
          </Badge>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="table-controls flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted">Tamaño de muestra</span>
                <select
                  className="field w-36"
                  value={state.sampleSize}
                  onChange={(event) => setSampleSize(Number(event.target.value) as SampleSize)}
                >
                  {SAMPLE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} registros
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="primary" icon={RefreshCw} onClick={() => regenerate(state.sampleSize)}>
                Nueva muestra
              </Button>
              <Button icon={Download} onClick={exportCsv}>
                Descargar CSV
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] text-faint">
              <span>
                Semilla <code className="text-muted">{state.sample.seed}</code>
              </span>
              <span>Generada: {formatDate(state.sample.generatedAt)}</span>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Carrera"
              value={state.filters.major}
              onChange={(value) => setFilter("major", value as Major | "all")}
              options={[
                { value: "all", label: "Todas las carreras" },
                ...MAJORS.map((major) => ({ value: major, label: major })),
              ]}
            />
            <SelectField
              label="Sexo"
              value={state.filters.sex}
              onChange={(value) => setFilter("sex", value as Sex | "all")}
              options={[
                { value: "all", label: "Todos" },
                ...SEXES.map((sex) => ({ value: sex, label: sex })),
              ]}
            />
            <SelectField
              label="Año académico"
              value={String(state.filters.year)}
              onChange={(value) =>
                setFilter("year", value === "all" ? "all" : (Number(value) as AcademicYear))
              }
              options={[
                { value: "all", label: "Todos los años" },
                ...ACADEMIC_YEARS.map((year) => ({ value: String(year), label: `${year}.º año` })),
              ]}
            />
            <div className="flex items-end gap-2">
              <div className="flex min-h-10 flex-1 flex-wrap items-center gap-2">
                {activeFilterCount === 0 ? (
                  <span className="text-xs text-faint">Sin filtros globales activos</span>
                ) : (
                  activeFilters.map((filter) => (
                    <span key={filter.key} className="chip">
                      {filter.label}: {filter.value}
                      <button
                        type="button"
                        aria-label={`Quitar filtro ${filter.label}`}
                        onClick={() => clearFilter(filter.key)}
                        className="rounded-full p-0.5 text-muted hover:bg-surface-3 hover:text-fg"
                      >
                        <X aria-hidden="true" size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {activeFilterCount > 0 ? <ResetFiltersButton onClick={resetFilters} /> : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                aria-hidden="true"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                className="field pl-9 pr-9"
                placeholder="Buscar en la tabla"
                aria-label="Buscar en la tabla"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Filter aria-hidden="true" size={14} />
              <span>
                {activeFilterCount > 0
                  ? "Los filtros globales están activos."
                  : "La búsqueda solo afecta esta tabla."}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {filteredRows.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No hay registros con estos filtros"
              description="La muestra completa sigue disponible. Limpia los filtros para volver a ver todos los datos y reactivar los análisis."
              action={<ResetFiltersButton onClick={resetFilters} />}
            />
          ) : sortedRows.length === 0 ? (
            <EmptyState
              icon={Search}
              title="La búsqueda no encontró coincidencias"
              description="Prueba con otra palabra o limpia el campo de búsqueda. La búsqueda no cambia los análisis."
              action={
                <Button icon={RotateCcw} onClick={() => setSearch("")}>
                  Limpiar búsqueda
                </Button>
              }
            />
          ) : (
            <>
              <p className="mb-2 text-[0.68rem] text-faint sm:hidden">
                Desliza horizontalmente para ver todas las columnas.
              </p>
              <div className="table-wrap max-h-[36rem] overflow-auto">
                <table className="data-table">
                  <caption className="sr-only">
                    Base de datos sintética de hábitos de tecnología y rendimiento académico. Datos
                    educativos, no reales.
                  </caption>
                  <thead>
                    <tr>
                      {columns.map((column) => {
                        const active = sort.key === column.key;
                        return (
                          <th
                            key={column.key}
                            scope="col"
                            aria-sort={
                              active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
                            }
                          >
                            <button
                              type="button"
                              onClick={() => changeSort(column.key)}
                              className="inline-flex items-center gap-1 text-left uppercase tracking-[0.05em] text-inherit hover:text-fg"
                            >
                              {column.label}
                              {column.unit ? (
                                <span className="font-normal normal-case tracking-normal text-faint">
                                  ({column.unit})
                                </span>
                              ) : null}
                              {active ? (
                                sort.direction === "asc" ? (
                                  <ArrowUp aria-hidden="true" size={11} className="text-accent" />
                                ) : (
                                  <ArrowDown aria-hidden="true" size={11} className="text-accent" />
                                )
                              ) : (
                                <ArrowUpDown aria-hidden="true" size={11} className="text-faint" />
                              )}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row) => (
                      <tr key={row.id}>
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={
                              column.key === "id"
                                ? "font-mono text-xs text-muted"
                                : typeof rawValue(row, column.key) === "number"
                                  ? "num"
                                  : undefined
                            }
                          >
                            {cellValue(row, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-controls mt-3 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Mostrando {rangeStart} a {rangeEnd} de {sortedRows.length} registros
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <span className="text-faint">Filas por página</span>
                    <select
                      className="field h-9 w-20 py-1"
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    size="sm"
                    icon={ChevronLeft}
                    aria-label="Página anterior"
                    disabled={currentPage === 0}
                    onClick={() => setPage(Math.max(0, currentPage - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="min-w-16 text-center">
                    {currentPage + 1} / {pages}
                  </span>
                  <Button
                    size="sm"
                    iconRight={ChevronRight}
                    aria-label="Página siguiente"
                    disabled={currentPage >= pages - 1}
                    onClick={() => setPage(Math.min(pages - 1, currentPage + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="mt-5">
        <Callout tone="info" title="Datos sintéticos con fines educativos">
          Esta base no proviene de estudiantes reales. Se generó con una semilla reproducible para
          practicar estadística. No debe usarse para afirmar nada sobre la población universitaria.
        </Callout>
      </div>
    </section>
  );
}
