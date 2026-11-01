import { useEffect, useMemo, useState } from "react";
import { useSample } from "../../state/SampleContext";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression } from "../../stats/regression";
import { formatEquation, formatNumber } from "../../lib/format";
import { ScatterPlot } from "../visuals/ScatterPlot";
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
      title="Más estudio, ¿mejor promedio?"
      insight="La recta resume la tendencia de esta muestra. Mové las horas de estudio y mirá qué promedio estima el modelo."
    >
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="deck-panel h-[clamp(14rem,38vh,28rem)] p-3 sm:p-4">
          <div className="aspect-[12/7] h-full w-full">
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
            {correlation ? formatNumber(correlation.r, 2) : "s/d"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {correlation ? `${correlation.strength}, ${correlation.direction}` : "No calculable"} · R²{" "}
            {regression ? formatNumber(regression.r2, 2) : "s/d"}
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
              {formatNumber(predicted, 1)}
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
