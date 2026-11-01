import { useMemo, useState } from "react";
import { useSample } from "../../state/SampleContext";
import type { QuantitativeKey } from "../../data/types";
import { describe } from "../../stats/descriptive";
import { groupedFrequency } from "../../stats/frequency";
import { formatNumber } from "../../lib/format";
import { Histogram } from "../visuals/Histogram";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { cn, SceneFrame, type SceneProps } from "../SceneFrame";

const VARIABLES: Array<{ key: QuantitativeKey; short: string; label: string; unit: string }> = [
  { key: "screenHours", short: "Pantalla", label: "Horas de pantalla", unit: "h/día" },
  { key: "studyHours", short: "Estudio", label: "Horas de estudio", unit: "h/semana" },
  { key: "sleepHours", short: "Sueño", label: "Horas de sueño", unit: "h/noche" },
  { key: "gpa", short: "Promedio", label: "Promedio académico", unit: "puntos" },
];

const READINGS: Record<QuantitativeKey, (median: number) => string> = {
  screenHours: (median) => `La mitad de la muestra pasa más de ${formatNumber(median, 1)} horas al día frente a pantallas.`,
  studyHours: (median) => `La mitad dedica más de ${formatNumber(median, 1)} horas semanales al estudio independiente.`,
  sleepHours: (median) => `La mitad duerme más de ${formatNumber(median, 1)} horas por noche.`,
  gpa: (median) => `La mitad de la muestra supera los ${formatNumber(median, 1)} puntos de promedio.`,
  age: (median) => `La mitad de la muestra tiene más de ${formatNumber(median, 0)} años.`,
  socialHours: (median) => `La mitad usa redes sociales más de ${formatNumber(median, 1)} horas al día.`,
};

export function DistributionScene(_: SceneProps) {
  const { sample } = useSample();
  const [selected, setSelected] = useState<QuantitativeKey>("screenHours");
  const variable = VARIABLES.find((item) => item.key === selected) ?? VARIABLES[0]!;

  const summary = useMemo(
    () => describe(sample.rows.map((row) => row[selected])),
    [sample, selected],
  );
  const grouped = useMemo(
    () => groupedFrequency(sample.rows.map((row) => row[selected]), 8),
    [sample, selected],
  );

  return (
    <SceneFrame
      kicker="04 / LA FORMA"
      title={<>No todos usan la tecnología <em>igual</em>.</>}
      insight="Cambiá la variable y mirá cómo se mueve la forma. La media y la mediana cuentan historias distintas."
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-5 flex flex-wrap gap-2">
          {VARIABLES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(item.key)}
              className={cn(
                "rounded-[1px] border px-3 py-1.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors",
                selected === item.key
                  ? "border-accent bg-accent text-bg"
                  : "border-border bg-transparent text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {item.short}
            </button>
          ))}
        </div>

        <div className="grid flex-1 items-center gap-8 xl:grid-cols-[0.68fr_1.32fr]">
          <div>
            <p className="deck-label">Media</p>
            <p className="deck-stat mt-2 text-accent">
              <AnimatedNumber value={summary.mean} digits={1} />
              <span className="ml-2 font-sans text-sm font-medium tracking-normal text-muted">
                {variable.unit}
              </span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {summary.median === null ? "No calculable." : READINGS[selected](summary.median)}
            </p>

            <div className="mt-6 grid max-w-sm grid-cols-3 gap-3 border-t border-border pt-4">
              <div>
                <p className="deck-label">Mediana</p>
                <p className="mt-1 text-xl tabular-nums text-fg">
                  <AnimatedNumber value={summary.median} digits={1} />
                </p>
              </div>
              <div>
                <p className="deck-label">Desv. est.</p>
                <p className="mt-1 text-xl tabular-nums text-fg">
                  <AnimatedNumber value={summary.stdDev} digits={2} />
                </p>
              </div>
              <div>
                <p className="deck-label">Rango</p>
                <p className="mt-1 text-xl tabular-nums text-fg">
                  <AnimatedNumber value={summary.range} digits={1} />
                </p>
              </div>
            </div>
          </div>

          <div className="deck-panel flex h-[clamp(13rem,32vh,22rem)] flex-col p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="deck-fig">Fig. 3 · {variable.label}</p>
              <span className="font-mono text-[0.58rem] text-faint">Ocho intervalos</span>
            </div>
            <div className="min-h-0 flex-1">
              <Histogram
                key={selected}
                rows={grouped.rows}
                mean={summary.mean}
                label={variable.label}
                unit={variable.unit}
              />
            </div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
