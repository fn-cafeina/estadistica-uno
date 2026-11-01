import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { RegressionResult } from "../../stats/regression";
import { formatNumber } from "../../lib/format";

export interface ScatterPoint {
  x: number;
  y: number;
}

interface ScatterPlotProps {
  points: readonly ScatterPoint[];
  regression: RegressionResult | null;
  xLabel: string;
  yLabel: string;
  xUnit?: string | null;
  yUnit?: string | null;
  predictionX?: number | null;
  highlightedIndex?: number | null;
  originalHighlight?: ScatterPoint | null;
  onPointDrag?: (index: number, x: number, y: number) => void;
  xDomain?: readonly [number, number];
  yDomain?: readonly [number, number];
  ariaLabel: string;
  className?: string;
}

const WIDTH = 900;
const HEIGHT = 340;
const PAD_LEFT = 62;
const PAD_RIGHT = 22;
const PAD_TOP = 18;
const PAD_BOTTOM = 44;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ScatterPlot({
  points,
  regression,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  predictionX,
  highlightedIndex,
  originalHighlight,
  onPointDrag,
  xDomain,
  yDomain,
  ariaLabel,
  className,
}: ScatterPlotProps) {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  if (points.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted">
          No hay puntos para mostrar.
        </div>
      </div>
    );
  }

  const rawXMin = xDomain?.[0] ?? Math.min(...points.map((point) => point.x));
  const rawXMax = xDomain?.[1] ?? Math.max(...points.map((point) => point.x));
  const rawYMin = yDomain?.[0] ?? Math.min(...points.map((point) => point.y));
  const rawYMax = yDomain?.[1] ?? Math.max(...points.map((point) => point.y));
  const xPad = (rawXMax - rawXMin || 1) * 0.08;
  const yPad = (rawYMax - rawYMin || 1) * 0.1;
  const xMin = rawXMin - xPad;
  const xMax = rawXMax + xPad;
  const yMin = rawYMin - yPad;
  const yMax = rawYMax + yPad;
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const sx = (value: number) =>
    PAD_LEFT + ((value - xMin) / xRange) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const sy = (value: number) =>
    HEIGHT - PAD_BOTTOM - ((value - yMin) / yRange) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const predictedY =
    predictionX !== null && predictionX !== undefined && regression
      ? regression.intercept + regression.slope * predictionX
      : null;

  const pointerToData = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
    const offsetX = (rect.width - WIDTH * scale) / 2;
    const offsetY = (rect.height - HEIGHT * scale) / 2;
    const px = (clientX - rect.left - offsetX) / scale;
    const py = (clientY - rect.top - offsetY) / scale;
    const x = xMin + ((px - PAD_LEFT) / (WIDTH - PAD_LEFT - PAD_RIGHT)) * xRange;
    const y = yMin + ((HEIGHT - PAD_BOTTOM - py) / (HEIGHT - PAD_TOP - PAD_BOTTOM)) * yRange;
    return {
      x: clamp(x, rawXMin, rawXMax),
      y: clamp(y, rawYMin, rawYMax),
    };
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ touchAction: "none" }}
    >
      {ticks.map((fraction) => {
        const xValue = xMin + fraction * xRange;
        const yValue = yMin + fraction * yRange;
        return (
          <g key={fraction}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={sy(yValue)}
              y2={sy(yValue)}
              className="deck-grid-line"
            />
            <line
              x1={sx(xValue)}
              x2={sx(xValue)}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              className="deck-grid-line"
            />
            <text x={PAD_LEFT - 8} y={sy(yValue)} textAnchor="end" dominantBaseline="middle" className="deck-axis-label">
              {formatNumber(yValue, 0)}
            </text>
            <text
              x={sx(xValue)}
              y={HEIGHT - PAD_BOTTOM + 16}
              textAnchor="middle"
              className="deck-axis-label"
            >
              {formatNumber(xValue, 0)}
            </text>
          </g>
        );
      })}

      {regression ? (
        <line
          x1={sx(regression.xMin)}
          y1={sy(regression.intercept + regression.slope * regression.xMin)}
          x2={sx(regression.xMax)}
          y2={sy(regression.intercept + regression.slope * regression.xMax)}
          stroke="var(--accent-2)"
          strokeWidth="2.4"
          strokeOpacity="0.8"
        />
      ) : null}

      {predictionX !== null && predictionX !== undefined ? (
        <g>
          <line
            x1={sx(predictionX)}
            x2={sx(predictionX)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--accent)"
            strokeDasharray="4 5"
            strokeOpacity="0.55"
          />
          {predictedY !== null ? (
            <circle
              cx={sx(predictionX)}
              cy={sy(predictedY)}
              r={6}
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="3"
            />
          ) : null}
        </g>
      ) : null}

      {originalHighlight ? (
        <circle
          cx={sx(originalHighlight.x)}
          cy={sy(originalHighlight.y)}
          r={8}
          fill="none"
          stroke="var(--warning)"
          strokeOpacity="0.35"
          strokeDasharray="3 4"
        />
      ) : null}

      {points.map((point, index) => {
        const isHighlighted = index === highlightedIndex;
        if (isHighlighted && onPointDrag) {
          return (
            <circle
              key={`point-${index}`}
              cx={sx(point.x)}
              cy={sy(point.y)}
              r={dragging ? 11 : 8.5}
              fill="var(--warning)"
              stroke="var(--bg)"
              strokeWidth="3"
              style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                draggingRef.current = true;
                setDragging(true);
              }}
              onPointerMove={(event) => {
                event.stopPropagation();
                if (!draggingRef.current) return;
                const next = pointerToData(event.clientX, event.clientY);
                if (next) onPointDrag(index, next.x, next.y);
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                draggingRef.current = false;
                setDragging(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                draggingRef.current = false;
                setDragging(false);
              }}
            >
              <title>Punto editable. Arrastralo para cambiar la correlación.</title>
            </circle>
          );
        }

        return (
          <motion.circle
            key={`point-${index}`}
            cx={sx(point.x)}
            cy={sy(point.y)}
            r={4.2}
            fill="var(--accent)"
            fillOpacity={0.62}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : Math.min(0.45, index * 0.008) }}
          >
            <title>
              {xLabel}: {formatNumber(point.x, 1)} {xUnit ?? ""}. {yLabel}:{" "}
              {formatNumber(point.y, 1)} {yUnit ?? ""}.
            </title>
          </motion.circle>
        );
      })}

      <text x={PAD_LEFT} y={HEIGHT - 8} className="deck-axis-label">
        {xLabel}
        {xUnit ? ` (${xUnit})` : ""}
      </text>
      <text
        x={14}
        y={HEIGHT - PAD_BOTTOM}
        className="deck-axis-label"
        transform={`rotate(-90 14 ${HEIGHT - PAD_BOTTOM})`}
      >
        {yLabel}
        {yUnit ? ` (${yUnit})` : ""}
      </text>
    </svg>
  );
}
