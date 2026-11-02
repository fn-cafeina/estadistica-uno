import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateSample, randomSeed } from "../data/generator";
import {
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_SEED,
  type AcademicYear,
  type Major,
  type Sample,
  type Sex,
  type StudentRecord,
} from "../data/types";
import { csvFilename, downloadCsv, recordsToCsv } from "../lib/csv";

export interface LabFilters {
  major: Major | "all";
  sex: Sex | "all";
  year: AcademicYear | "all";
}

const EMPTY_FILTERS: LabFilters = {
  major: "all",
  sex: "all",
  year: "all",
};

interface LabContextValue {
  sample: Sample;
  filters: LabFilters;
  filteredRows: StudentRecord[];
  activeFilterCount: number;
  setFilter: <K extends keyof LabFilters>(key: K, value: LabFilters[K]) => void;
  resetFilters: () => void;
  regenerate: () => void;
  exportCsv: () => void;
}

const LabContext = createContext<LabContextValue | null>(null);

function filterRows(rows: readonly StudentRecord[], filters: LabFilters): StudentRecord[] {
  return rows.filter(
    (row) =>
      (filters.major === "all" || row.major === filters.major) &&
      (filters.sex === "all" || row.sex === filters.sex) &&
      (filters.year === "all" || row.year === filters.year),
  );
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [sample, setSample] = useState<Sample>(() =>
    generateSample(DEFAULT_SAMPLE_SIZE, DEFAULT_SEED),
  );
  const [filters, setFilters] = useState<LabFilters>(EMPTY_FILTERS);

  const filteredRows = useMemo(() => filterRows(sample.rows, filters), [sample.rows, filters]);
  const activeFilterCount = useMemo(
    () =>
      (filters.major === "all" ? 0 : 1) +
      (filters.sex === "all" ? 0 : 1) +
      (filters.year === "all" ? 0 : 1),
    [filters],
  );

  const setFilter = useCallback(
    <K extends keyof LabFilters>(key: K, value: LabFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const regenerate = useCallback(() => {
    setSample(generateSample(DEFAULT_SAMPLE_SIZE, randomSeed()));
    setFilters(EMPTY_FILTERS);
  }, []);

  const exportCsv = useCallback(() => {
    downloadCsv(csvFilename(filteredRows.length, sample.seed), recordsToCsv(filteredRows));
  }, [filteredRows, sample.seed]);

  const value = useMemo<LabContextValue>(
    () => ({
      sample,
      filters,
      filteredRows,
      activeFilterCount,
      setFilter,
      resetFilters,
      regenerate,
      exportCsv,
    }),
    [
      activeFilterCount,
      exportCsv,
      filteredRows,
      filters,
      regenerate,
      resetFilters,
      sample,
      setFilter,
    ],
  );

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab(): LabContextValue {
  const context = useContext(LabContext);
  if (!context) throw new Error("useLab debe usarse dentro de LabProvider");
  return context;
}
