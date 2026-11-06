import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useLab } from "../LabContext";
import {
  ACADEMIC_YEARS,
  MAJORS,
  SEXES,
  type AcademicYear,
  type Major,
  type Sex,
  type StudentRecord,
  type VariableKey,
} from "../../data/types";
import { VARIABLE_MAP, VARIABLES, formatCategoricalValue } from "../../data/schema";
import { formatDate, formatNumber } from "../../lib/format";
import {
  Section,
  Panel,
  Badge,
  Button,
  EmptyState,
  ResetFiltersButton,
  SelectField,
  TableWrap,
} from "../components";

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

function DataTable({
  rows,
  columns,
  caption,
}: {
  rows: readonly StudentRecord[];
  columns: readonly { key: SortKey; label: string; unit: string | null }[];
  caption: string;
}) {
  return (
    <TableWrap>
      <table className="lab-table min-w-[68rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.key === "id" ? "" : "num"}>
                {column.label}
                {column.unit ? <span className="ml-1 font-normal normal-case tracking-normal">({column.unit})</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.key === "id" ? "font-mono text-label text-muted" : "num"}
                >
                  {cellValue(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function DatabaseSection() {
  const {
    sample,
    filters,
    filteredRows,
    activeFilterCount,
    setFilter,
    resetFilters,
    exportCsv,
  } = useLab();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "id",
    direction: "asc",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => setPage(0), [filteredRows, deferredSearch, sort, pageSize]);

  const searchedRows = useMemo(() => {
    const term = normalizeText(deferredSearch.trim());
    if (!term) return filteredRows;
    return filteredRows.filter((row) => normalizeText(Object.values(row).join(" ")).includes(term));
  }, [deferredSearch, filteredRows]);

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
  const rangeStart = sortedRows.length === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min(sortedRows.length, (currentPage + 1) * pageSize);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: "major" | "sex" | "year"; label: string; value: string }> = [];
    if (filters.major !== "all") {
      items.push({ key: "major", label: "Carrera", value: filters.major });
    }
    if (filters.sex !== "all") {
      items.push({ key: "sex", label: "Sexo", value: filters.sex });
    }
    if (filters.year !== "all") {
      items.push({ key: "year", label: "Año", value: `${filters.year}.º` });
    }
    return items;
  }, [filters]);

  const changeSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const columns: Array<{ key: SortKey; label: string; unit: string | null }> = [
    { key: "id", label: "ID", unit: null },
    ...VARIABLES.map((variable) => ({ key: variable.key, label: variable.label, unit: variable.unit })),
  ];
  const printKeys: SortKey[] = ["id", "age", "sex", "major", "screenHours", "studyHours", "gpa"];
  const printColumns = columns.filter((column) => printKeys.includes(column.key));

  return (
    <Section
      id="base-datos"
      title={<>La muestra, <em>fila por fila</em>.</>}
      description="Ordena, busca y filtra los registros. Los filtros globales afectan la tabla y todos los análisis del laboratorio."
      aside={
        <Badge tone={filteredRows.length === sample.n ? "accent" : "warning"}>
          {filteredRows.length} de {sample.n} registros
        </Badge>
      }
    >
      <Panel className="no-print">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button icon={Download} onClick={exportCsv}>
                Descargar CSV
              </Button>
            </div>
            <p className="font-mono text-label uppercase tracking-[0.06em] text-faint">
              Semilla {sample.seed} · {formatDate(sample.generatedAt)} · datos sintéticos
            </p>
          </div>

          <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Carrera"
              value={filters.major}
              onChange={(value) => setFilter("major", value as Major | "all")}
              options={[
                { value: "all", label: "Todas las carreras" },
                ...MAJORS.map((major) => ({ value: major, label: major })),
              ]}
            />
            <SelectField
              label="Sexo"
              value={filters.sex}
              onChange={(value) => setFilter("sex", value as Sex | "all")}
              options={[
                { value: "all", label: "Todos" },
                ...SEXES.map((sex) => ({ value: sex, label: sex })),
              ]}
            />
            <SelectField
              label="Año académico"
              value={String(filters.year)}
              onChange={(value) =>
                setFilter("year", value === "all" ? "all" : (Number(value) as AcademicYear))
              }
              options={[
                { value: "all", label: "Todos los años" },
                ...ACADEMIC_YEARS.map((year) => ({ value: String(year), label: `${year}.º año` })),
              ]}
            />
            <div className="flex flex-wrap items-end gap-2">
              {activeFilterCount === 0 ? (
                <span className="text-xs text-faint">Sin filtros globales</span>
              ) : (
                activeFilters.map((filter) => (
                  <span key={filter.key} className="lab-chip">
                    {filter.label}: {filter.value}
                    <button
                      type="button"
                      aria-label={`Quitar filtro ${filter.label}`}
                      onClick={() => setFilter(filter.key, "all")}
                      className="text-accent"
                    >
                      <X aria-hidden="true" size={11} />
                    </button>
                  </span>
                ))
              )}
              {activeFilterCount > 0 ? <ResetFiltersButton onClick={resetFilters} /> : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block w-full sm:max-w-sm">
              <span className="lab-form-label">Buscar en la tabla</span>
              <span className="lab-field-wrap block">
                <Search aria-hidden="true" size={14} className="lab-field-icon" />
                <input
                  type="search"
                  className="lab-field"
                  placeholder="Carrera, dispositivo, valor..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </span>
            </label>
            <p className="flex items-center gap-2 text-xs text-muted">
              <Filter aria-hidden="true" size={13} />
              La búsqueda solo afecta esta tabla.
            </p>
          </div>

          <div className="mt-1 min-w-0">
            {filteredRows.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="No hay registros con estos filtros"
                description="La muestra completa sigue disponible. Limpia los filtros para volver a ver todos los datos."
                action={<ResetFiltersButton onClick={resetFilters} />}
              />
            ) : sortedRows.length === 0 ? (
              <EmptyState
                icon={Search}
                title="La búsqueda no encontró coincidencias"
                description="Prueba con otra palabra o limpia la búsqueda. La búsqueda no cambia los análisis."
                action={
                  <Button icon={RotateCcw} onClick={() => setSearch("")}>
                    Limpiar búsqueda
                  </Button>
                }
              />
            ) : (
              <>
                <p className="mb-2 text-label text-faint">
                  Desliza horizontalmente para ver todas las columnas.
                </p>
                <div className="lab-table-wrap max-h-[34rem] overflow-auto">
                  <table className="lab-table min-w-[68rem]">
                    <caption className="sr-only">
                      Base de datos sintética de uso de tecnología y rendimiento académico.
                    </caption>
                    <thead>
                      <tr>
                        {columns.map((column) => {
                          const active = sort.key === column.key;
                          return (
                            <th
                              key={column.key}
                              scope="col"
                              aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                              className={column.key === "id" ? "" : "num"}
                            >
                              <button
                                type="button"
                                onClick={() => changeSort(column.key)}
                                className="inline-flex items-center gap-1 text-left text-inherit hover:text-fg"
                              >
                                {column.label}
                                {column.unit ? (
                                  <span className="font-normal normal-case tracking-normal">({column.unit})</span>
                                ) : null}
                                {active ? (
                                  sort.direction === "asc" ? (
                                    <ArrowUp aria-hidden="true" size={10} className="text-accent" />
                                  ) : (
                                    <ArrowDown aria-hidden="true" size={10} className="text-accent" />
                                  )
                                ) : (
                                  <ArrowUpDown aria-hidden="true" size={10} className="text-faint" />
                                )}
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => (
                        <tr key={row.id}>
                          {columns.map((column) => (
                            <td
                              key={column.key}
                              className={column.key === "id" ? "font-mono text-label text-muted" : "num"}
                            >
                              {cellValue(row, column.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Mostrando {rangeStart} a {rangeEnd} de {sortedRows.length} registros
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2">
                      <span className="text-faint">Filas por página</span>
                      <select
                        className="lab-field h-8 w-20 py-1"
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
                      aria-label="Página anterior"
                      disabled={currentPage === 0}
                      onClick={() => setPage(Math.max(0, currentPage - 1))}
                    >
                      <ChevronLeft aria-hidden="true" size={14} />
                      Anterior
                    </Button>
                    <span className="min-w-14 text-center tabular-nums">
                      {currentPage + 1} / {pages}
                    </span>
                    <Button
                      aria-label="Página siguiente"
                      disabled={currentPage >= pages - 1}
                      onClick={() => setPage(Math.min(pages - 1, currentPage + 1))}
                    >
                      Siguiente
                      <ChevronRight aria-hidden="true" size={14} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Panel>

      <div className="lab-print-only mt-5">
        <h3 className="lab-panel-title mb-3">Base completa filtrada</h3>
        <DataTable
          rows={filteredRows}
          columns={printColumns}
          caption="Base de datos filtrada con las columnas principales."
        />
      </div>
    </Section>
  );
}
