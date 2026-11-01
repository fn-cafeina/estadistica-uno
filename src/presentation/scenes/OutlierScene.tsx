import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Move } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { pearsonCorrelation } from "../../stats/correlation";
import { linearRegression } from "../../stats/regression";
import { ScatterPlot, type ScatterPoint } from "../visuals/ScatterPlot";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { SceneFrame, cn, type SceneProps } from "../SceneFrame";

function largestResidualIndex(points: readonly ScatterPoint[], residuals: readonly number[]): number {
  let best = 0;
  let bestValue = -1;
  residuals.forEach((residual, index) => {
    if (Math.abs(residual) > bestValue) {
      bestValue = Math.abs(residual);
      best = index;
    }
  });
  return points.length > 0 ? best : -1;
}

export function OutlierScene(_: SceneProps) {
  const { sample } = useSample();
  const basePoints = useMemo(
    () => sample.rows.map((row) => ({ x: row.studyHours, y: row.gpa })),
    [sample],
  );
  const baseRegression = useMemo(
    () =>
      linearRegression(
        basePoints.map((point) => point.x),
        basePoints.map((point) => point.y),
      ),
    [basePoints],
  );
  const baseCorrelation = useMemo(
    () =>
      pearsonCorrelation(
        basePoints.map((point) => point.x),
        basePoints.map((point) => point.y),
      ),
    [basePoints],
  );

  const targetIndex = useMemo(() => {
    if (!baseRegression) return -1;
    return largestResidualIndex(
      basePoints,
      baseRegression.points.map((point) => point.residual),
    );
  }, [basePoints, baseRegression]);

  const [editedPoints, setEditedPoints] = useState<ScatterPoint[]>(basePoints);

  useEffect(() => {
    setEditedPoints(basePoints);
  }, [basePoints]);

  const currentRegression = useMemo(
    () =>
      linearRegression(
        editedPoints.map((point) => point.x),
        editedPoints.map((point) => point.y),
      ),
    [editedPoints],
  );
  const currentCorrelation = useMemo(
    () =>
      pearsonCorrelation(
        editedPoints.map((point) => point.x),
        editedPoints.map((point) => point.y),
      ),
    [editedPoints],
  );

  const baseR = baseCorrelation?.r ?? null;
  const currentR = currentCorrelation?.r ?? null;
  const delta = baseR !== null && currentR !== null ? currentR - baseR : null;
  const originalTarget = targetIndex >= 0 ? basePoints[targetIndex] : null;

  const xDomain = useMemo<[number, number]>(() => {
    const xs = basePoints.map((point) => point.x);
    return [Math.min(...xs), Math.max(...xs)];
  }, [basePoints]);
  const yDomain = useMemo<[number, number]>(() => {
    const ys = basePoints.map((point) => point.y);
    return [Math.min(...ys), Math.max(...ys)];
  }, [basePoints]);

  return (
    <SceneFrame
      kicker="06 / EL TRUCO"
      title={<>Un solo punto <em>cambia la historia</em>.</>}
      insight="Arrastrá el punto ámbar. La recta y la correlación se recalculan en vivo. La relación no es una propiedad fija de los datos."
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="deck-panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="deck-fig">Fig. 6 · Influencia de un punto</p>
            <span className="font-mono text-[0.58rem] text-faint">n = {editedPoints.length}</span>
          </div>
          <div className="aspect-[8/3] w-full">
            <ScatterPlot
              points={editedPoints}
              regression={currentRegression}
              xLabel="Estudio"
              yLabel="Promedio"
              xUnit="h/semana"
              yUnit="puntos"
              highlightedIndex={targetIndex}
              originalHighlight={originalTarget}
              onPointDrag={(index, x, y) => {
                setEditedPoints((current) =>
                  current.map((point, pointIndex) => (pointIndex === index ? { x, y } : point)),
                );
              }}
              xDomain={xDomain}
              yDomain={yDomain}
              ariaLabel="Diagrama de dispersión con un punto editable para mostrar la influencia de valores atípicos"
              className="h-full w-full"
            />
          </div>
        </div>

        <div>
          <p className="deck-label">Correlación actual</p>
          <p className="deck-stat mt-2 text-warning">
            <AnimatedNumber value={currentR} digits={2} duration={0.28} />
          </p>
          <p className="mt-2 text-sm text-muted">
            Antes era <AnimatedNumber value={baseR} digits={2} duration={0.28} />.
          </p>

          <div className="mt-6 border-t border-border pt-4">
            <p className="deck-label">Cambio</p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                delta === null || Math.abs(delta) < 0.01
                  ? "text-muted"
                  : Math.abs(delta) > 0.15
                    ? "text-warning"
                    : "text-fg",
              )}
            >
              <AnimatedNumber
                value={delta}
                digits={3}
                duration={0.28}
                prefix={delta !== null && delta > 0 ? "+" : ""}
              />
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {delta === null
                ? "Arrastrá el punto para recalcular."
                : Math.abs(delta) < 0.02
                  ? "Todavía no cambió mucho. Seguí arrastrando."
                  : "Un solo punto movió la correlación. Eso también es parte del análisis."}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[0.68rem] text-faint">
            <Move aria-hidden="true" size={14} />
            Arrastrá el punto ámbar
          </div>

          <button
            type="button"
            className="deck-control mt-5"
            onClick={() => setEditedPoints(basePoints)}
          >
            <RotateCcw aria-hidden="true" size={14} />
            Restablecer
          </button>
        </div>
      </div>
    </SceneFrame>
  );
}
