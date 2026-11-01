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
  type Sample,
  type SampleSize,
} from "../data/types";
import { csvFilename, downloadCsv, recordsToCsv } from "../lib/csv";

interface SampleContextValue {
  sample: Sample;
  sampleSize: SampleSize;
  regenerate: (size?: SampleSize) => void;
  setSampleSize: (size: SampleSize) => void;
  exportCsv: () => void;
}

const SampleContext = createContext<SampleContextValue | null>(null);

export function SampleProvider({ children }: { children: ReactNode }) {
  const [sample, setSample] = useState<Sample>(() => generateSample(DEFAULT_SAMPLE_SIZE, DEFAULT_SEED));
  const [sampleSize, setSampleSize] = useState<SampleSize>(DEFAULT_SAMPLE_SIZE);

  const regenerate = useCallback(
    (size?: SampleSize) => {
      const nextSize = size ?? sampleSize;
      setSample(generateSample(nextSize, randomSeed()));
      setSampleSize(nextSize);
    },
    [sampleSize],
  );

  const exportCsv = useCallback(() => {
    downloadCsv(csvFilename(sample.n, sample.seed), recordsToCsv(sample.rows));
  }, [sample]);

  const value = useMemo<SampleContextValue>(
    () => ({ sample, sampleSize, regenerate, setSampleSize, exportCsv }),
    [sample, sampleSize, regenerate, setSampleSize, exportCsv],
  );

  return <SampleContext.Provider value={value}>{children}</SampleContext.Provider>;
}

export function useSample(): SampleContextValue {
  const context = useContext(SampleContext);
  if (!context) throw new Error("useSample debe usarse dentro de SampleProvider");
  return context;
}
