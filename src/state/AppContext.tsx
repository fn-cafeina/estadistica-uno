import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  BAR_VARIABLES,
  COMPARISON_VARIABLES,
  DEFAULT_BAR_VARIABLE,
  DEFAULT_CHI_PAIR,
  DEFAULT_COMPARISON_VARIABLE,
  DEFAULT_CORRELATION_X,
  DEFAULT_CORRELATION_Y,
  DEFAULT_PIE_VARIABLE,
  DEFAULT_REGRESSION_X,
  DEFAULT_REGRESSION_Y,
  PIE_VARIABLES,
  type ChiPairId,
} from "../data/analysis";
import { generateSample, randomSeed } from "../data/generator";
import {
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_SEED,
  EMPTY_FILTERS,
  type Filters,
  type Major,
  type QualitativeKey,
  type QuantitativeKey,
  type Sample,
  type SampleSize,
  type Sex,
  type StudentRecord,
  type ThemeId,
  type AcademicYear,
} from "../data/types";
import { csvFilename, downloadCsv, recordsToCsv } from "../lib/csv";
import { applyTheme, loadStoredTheme } from "../lib/theme";

export interface Selections {
  freqMode: "qualitative" | "quantitative";
  freqQualitative: QualitativeKey;
  freqQuantitative: QuantitativeKey;
  bins: number;
  descriptive: QuantitativeKey;
  chiPair: ChiPairId;
  correlationX: QuantitativeKey;
  correlationY: QuantitativeKey;
  regressionX: QuantitativeKey;
  regressionY: QuantitativeKey;
  barVariable: QualitativeKey;
  pieVariable: QualitativeKey;
  comparisonVariable: QualitativeKey;
}

export interface ToastMessage {
  id: number;
  message: string;
}

export interface AppState {
  sample: Sample;
  filters: Filters;
  sampleSize: SampleSize;
  selections: Selections;
  alpha: number;
  theme: ThemeId;
  printing: boolean;
  toast: ToastMessage | null;
  helpOpen: boolean;
}

type Action =
  | { type: "SET_SAMPLE"; sample: Sample }
  | { type: "SET_SAMPLE_SIZE"; sampleSize: SampleSize }
  | { type: "SET_FILTER"; key: keyof Filters; value: Filters[keyof Filters] }
  | { type: "RESET_FILTERS" }
  | { type: "SET_SELECTION"; key: keyof Selections; value: string | number }
  | { type: "SET_ALPHA"; alpha: number }
  | { type: "SET_THEME"; theme: ThemeId }
  | { type: "SET_PRINTING"; printing: boolean }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "CLEAR_TOAST" }
  | { type: "OPEN_HELP" }
  | { type: "CLOSE_HELP" };

const DEFAULT_SELECTIONS: Selections = {
  freqMode: "qualitative",
  freqQualitative: "major",
  freqQuantitative: "screenHours",
  bins: 6,
  descriptive: "gpa",
  chiPair: DEFAULT_CHI_PAIR,
  correlationX: DEFAULT_CORRELATION_X,
  correlationY: DEFAULT_CORRELATION_Y,
  regressionX: DEFAULT_REGRESSION_X,
  regressionY: DEFAULT_REGRESSION_Y,
  barVariable: DEFAULT_BAR_VARIABLE,
  pieVariable: DEFAULT_PIE_VARIABLE,
  comparisonVariable: DEFAULT_COMPARISON_VARIABLE,
};

function createInitialState(): AppState {
  return {
    sample: generateSample(DEFAULT_SAMPLE_SIZE, DEFAULT_SEED),
    filters: { ...EMPTY_FILTERS },
    sampleSize: DEFAULT_SAMPLE_SIZE,
    selections: { ...DEFAULT_SELECTIONS },
    alpha: 0.05,
    theme: loadStoredTheme(),
    printing: false,
    toast: null,
    helpOpen: false,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SAMPLE":
      return { ...state, sample: action.sample };
    case "SET_SAMPLE_SIZE":
      return { ...state, sampleSize: action.sampleSize };
    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case "RESET_FILTERS":
      return { ...state, filters: { ...EMPTY_FILTERS } };
    case "SET_SELECTION":
      return {
        ...state,
        selections: { ...state.selections, [action.key]: action.value } as Selections,
      };
    case "SET_ALPHA":
      return { ...state, alpha: action.alpha };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "SET_PRINTING":
      return { ...state, printing: action.printing };
    case "SHOW_TOAST":
      return { ...state, toast: { id: Date.now(), message: action.message } };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    case "OPEN_HELP":
      return { ...state, helpOpen: true };
    case "CLOSE_HELP":
      return { ...state, helpOpen: false };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  filteredRows: StudentRecord[];
  activeFilterCount: number;
  dispatch: Dispatch<Action>;
  regenerate: (size?: SampleSize) => void;
  resetFilters: () => void;
  setFilter: (key: keyof Filters, value: Filters[keyof Filters]) => void;
  setSelection: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
  setSampleSize: (size: SampleSize) => void;
  setAlpha: (alpha: number) => void;
  setTheme: (theme: ThemeId) => void;
  exportCsv: () => void;
  printReport: () => void;
  openHelp: () => void;
  closeHelp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 3800);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  useEffect(() => {
    const before = () => dispatch({ type: "SET_PRINTING", printing: true });
    const after = () => dispatch({ type: "SET_PRINTING", printing: false });
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const filteredRows = useMemo(
    () =>
      state.sample.rows.filter(
        (row) =>
          (state.filters.major === "all" || row.major === state.filters.major) &&
          (state.filters.sex === "all" || row.sex === state.filters.sex) &&
          (state.filters.year === "all" || row.year === state.filters.year),
      ),
    [state.sample, state.filters],
  );

  const activeFilterCount = useMemo(
    () =>
      Number(state.filters.major !== "all") +
      Number(state.filters.sex !== "all") +
      Number(state.filters.year !== "all"),
    [state.filters],
  );

  const regenerate = useCallback(
    (size?: SampleSize) => {
      const nextSize = size ?? state.sampleSize;
      const sample = generateSample(nextSize, randomSeed());
      dispatch({ type: "SET_SAMPLE", sample });
      dispatch({ type: "SET_SAMPLE_SIZE", sampleSize: nextSize });
      dispatch({ type: "SHOW_TOAST", message: `Nueva muestra generada: ${nextSize} registros.` });
    },
    [state.sampleSize],
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
    dispatch({ type: "SHOW_TOAST", message: "Filtros restablecidos." });
  }, []);

  const setFilter = useCallback((key: keyof Filters, value: Filters[keyof Filters]) => {
    dispatch({ type: "SET_FILTER", key, value });
  }, []);

  const setSelection = useCallback(<K extends keyof Selections>(key: K, value: Selections[K]) => {
    dispatch({ type: "SET_SELECTION", key, value: value as string | number });
  }, []);

  const setSampleSize = useCallback(
    (sampleSize: SampleSize) => dispatch({ type: "SET_SAMPLE_SIZE", sampleSize }),
    [],
  );
  const setAlpha = useCallback((alpha: number) => dispatch({ type: "SET_ALPHA", alpha }), []);
  const setTheme = useCallback((theme: ThemeId) => {
    applyTheme(theme);
    dispatch({ type: "SET_THEME", theme });
  }, []);

  const exportCsv = useCallback(() => {
    downloadCsv(csvFilename(filteredRows.length, state.sample.seed), recordsToCsv(filteredRows));
    dispatch({ type: "SHOW_TOAST", message: `CSV exportado con ${filteredRows.length} registros.` });
  }, [filteredRows, state.sample.seed]);

  const printReport = useCallback(() => {
    dispatch({ type: "SET_PRINTING", printing: true });
    window.setTimeout(() => {
      window.print();
      dispatch({ type: "SET_PRINTING", printing: false });
    }, 280);
  }, []);

  const openHelp = useCallback(() => dispatch({ type: "OPEN_HELP" }), []);
  const closeHelp = useCallback(() => dispatch({ type: "CLOSE_HELP" }), []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      filteredRows,
      activeFilterCount,
      dispatch,
      regenerate,
      resetFilters,
      setFilter,
      setSelection,
      setSampleSize,
      setAlpha,
      setTheme,
      exportCsv,
      printReport,
      openHelp,
      closeHelp,
    }),
    [
      state,
      filteredRows,
      activeFilterCount,
      regenerate,
      resetFilters,
      setFilter,
      setSelection,
      setSampleSize,
      setAlpha,
      setTheme,
      exportCsv,
      printReport,
      openHelp,
      closeHelp,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe usarse dentro de AppProvider");
  return context;
}

export { BAR_VARIABLES, COMPARISON_VARIABLES, PIE_VARIABLES };
export type { Filters, Major, Sex, AcademicYear };
