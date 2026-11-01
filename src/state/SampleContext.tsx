import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateSample, randomSeed } from "../data/generator";
import { DEFAULT_SAMPLE_SIZE, DEFAULT_SEED, type Sample } from "../data/types";
import { csvFilename, downloadCsv, recordsToCsv } from "../lib/csv";

interface SampleContextValue {
  sample: Sample;
  regenerate: () => void;
  exportCsv: () => void;
}

const SampleContext = createContext<SampleContextValue | null>(null);

export function SampleProvider({ children }: { children: ReactNode }) {
  const [sample, setSample] = useState<Sample>(() =>
    generateSample(DEFAULT_SAMPLE_SIZE, DEFAULT_SEED),
  );

  const regenerate = useCallback(() => {
    setSample(generateSample(DEFAULT_SAMPLE_SIZE, randomSeed()));
  }, []);

  const exportCsv = useCallback(() => {
    downloadCsv(csvFilename(sample.n, sample.seed), recordsToCsv(sample.rows));
  }, [sample]);

  const value = useMemo<SampleContextValue>(
    () => ({ sample, regenerate, exportCsv }),
    [sample, regenerate, exportCsv],
  );

  return <SampleContext.Provider value={value}>{children}</SampleContext.Provider>;
}

export function useSample(): SampleContextValue {
  const context = useContext(SampleContext);
  if (!context) throw new Error("useSample debe usarse dentro de SampleProvider");
  return context;
}
