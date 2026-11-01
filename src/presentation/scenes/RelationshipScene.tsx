import { useEffect, useMemo, useState } from "react";
import { useSample } from "../../state/SampleContext";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression } from "../../stats/regression";
import { formatEquation, formatNumber } from "../../lib/format";
import { ScatterPlot } from "../visuals/ScatterPlot";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { SceneFrame, type SceneProps } from "../SceneFrame";

export function RelationshipScene(_: SceneProps) {
  const { sample } = useSample();
  const [hours, setHours] = useState(10);

  const study = useMemo(() => sample.rows.map((row) => row.studyHours), [sample]);
  const gpa = useMemo(() => sample.rows.map((row) => row.gpa), [sample]);
  const correlation = useMemo(() => pearsonCorrelation(study, gpa), [study, gpa]);
  const regression = useMemo(() => linearRegression(study, gpa), [study, gpa]);

  useEffect(() => {
    if (regression) setHours(Math.round(regression.meanX * 2) / 2);
  }, [sample.seed, regression?.meanX]);

  const predicted = regression ? regression.intercept + regression.slope * hours : null;
  const points = sample.rows.map((row) => ({ x: row.studyHours, y: row.gpa }));

  return (
    <SceneFrame
      kicker="05 / EL VÍNCULO"
      title={<>Más estudio, <em>¿mejor promedio?</em></>}
      insight="La recta resume la tendencia de esta muestra. Mové las horas de estudio y mirá qué promedio estima el modelo."
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="deck-panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="deck-fig">Fig. 5 · Dispersión y recta ajustada</p>
            <span className="font-mono text-[0.58rem] text-faint">n = {points.length}</span>
          </div>
          <div className="aspect-[8/3] w-full">
            <ScatterPlot
              points={points}
              regression={regression}
              xLabel="Estudio"
              yLabel="Promedio"
              xUnit="h/semana"
              yUnit="puntos"
              predictionX={hours}
              ariaLabel="Diagrama de dispersión de horas de estudio y promedio académico con recta de regresión"
              className="h-full w-full"
            />
          </div>
        </div>

        <div>
          <p className="deck-label">Correlación</p>
          <p className="deck-stat mt-2 text-accent">
            <AnimatedNumber value={correlation?.r} digits={2} />
          </p>
          <p className="mt-2 text-sm text-muted">
            {correlation ? `${correlation.strength}, ${correlation.direction}` : "No calculable"} · R²{" "}
            <AnimatedNumber value={regression?.r2} digits={2} />
          </p>

          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="study-hours" className="deck-label">
                Horas de estudio
              </label>
              <span className="font-mono text-xs text-muted">{formatNumber(hours, 1)} h/sem</span>
            </div>
            <input
              id="study-hours"
              type="range"
              min={regression ? Math.ceil(regression.xMin) : 0}
              max={regression ? Math.floor(regression.xMax) : 30}
              step={0.5}
              value={hours}
              className="deck-range mt-3"
              onChange={(event) => setHours(Number(event.target.value))}
            />
          </div>

          <div className="mt-7 border-t border-border pt-5">
            <p className="deck-label">Promedio estimado</p>
            <p className="deck-stat mt-2 text-accent">
              <AnimatedNumber value={predicted} digits={1} duration={0.32} />
              <span className="ml-2 font-sans text-sm font-medium tracking-normal text-muted">
                puntos
              </span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {regression
                ? formatEquation(regression.slope, regression.intercept, "estudio", "promedio")
                : "Modelo no disponible."}
            </p>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-faint">
              Predicción dentro del rango observado: {formatNumber(regression?.xMin, 1)} a{" "}
              {formatNumber(regression?.xMax, 1)} h/semana. No es una garantía individual.
            </p>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
