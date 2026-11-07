import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { DescriptiveSummary } from "../stats/descriptive";
import type { FrequencyRow, GroupedFrequencyRow } from "../stats/frequency";
import type { RegressionResult } from "../stats/regression";
import { formatInterval, formatNumber, formatPercent } from "../lib/format";
import { cn, DataDetails } from "./components";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// El viewBox de todos los gráficos mide 800 y el SVG se estira al contenedor,
// así que una fuente fija de 10px cae a ~4px en un teléfono y ~6px en
// escritorio. Cada tramo de ancho de lienzo lleva su tamaño para que las
// etiquetas ronden 11-13px en pantalla.
const FONT_TIERS: ReadonlyArray<readonly [maxWidth: number, font: number]> = [
  [369, 30],
  [509, 22],
  [699, 16],
  [949, 11.5],
  [Infinity, 10],
];

function fontForWidth(width: number): number {
  for (const [maxWidth, font] of FONT_TIERS) {
    if (width <= maxWidth) return font;
  }
  return 10;
}

// Estimación inicial del ancho del lienzo; el ResizeObserver la corrige en
// cuanto el SVG se coloca en la página.
function estimateCanvasWidth(): number {
  if (typeof window === "undefined") return 800;
  const viewport = window.innerWidth || 800;
  return Math.max(240, Math.min(viewport, 1180) - (viewport >= 1024 ? 700 : 61));
}

/** Ancho aproximado de un texto (0.6em por carácter) en unidades del viewBox. */
function textWidth(text: string, font: number): number {
  return text.length * 0.6 * font;
}

/** Paso para mostrar una de cada n marcas cuando las etiquetas no caben. */
function tickStride(labelWidth: number, spacing: number): number {
  if (spacing <= 0) return 1;
  return Math.max(1, Math.ceil((labelWidth * 1.2) / spacing));
}

/** Grosor de los ejes: a fuente grande un trazo de 1 unidad desaparece. */
function hairline(font: number): number {
  return Math.max(1, font * 0.09);
}

type ChartBox = {
  /** Se engancha al <svg>: su ancho real fija el tamaño de texto. */
  svgRef: (node: SVGSVGElement | null) => void;
  /** Tamaño de texto en unidades del viewBox. */
  font: number;
};

function useChartBox(): ChartBox {
  const [font, setFont] = useState(() => fontForWidth(estimateCanvasWidth()));
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  const svgRef = useCallback((node: SVGSVGElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const resize = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width <= 0) return;
      const next = fontForWidth(width);
      setFont((current) => (current === next ? current : next));
    });
    resize.observe(node);
    observer.current = resize;
  }, []);

  return { svgRef, font };
}

export function ChartCard({
  title,
  subtitle,
  interpretation,
  table,
  active,
  children,
}: {
  title: string;
  subtitle?: string;
  interpretation: ReactNode;
  table?: ReactNode;
  /** Cuando se indica, el gráfico es un procedimiento: se oculta si no está activo. */
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <figure
      className={cn("lab-chart", active === undefined ? undefined : "lab-procedure")}
      data-active={active}
    >
      <figcaption>
        <p className="lab-chart-title">{title}</p>
        {subtitle ? <p className="lab-chart-subtitle">{subtitle}</p> : null}
      </figcaption>
      <div className="lab-chart-canvas">{children}</div>
      <div className="lab-chart-caption">
        <p className="lab-label">¿Cómo se interpreta?</p>
        {interpretation}
      </div>
      {table ? <DataDetails>{table}</DataDetails> : null}
    </figure>
  );
}

export function BarChart({
  rows,
  label,
  ariaLabel,
}: {
  rows: readonly FrequencyRow[];
  label: string;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  if (rows.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...rows.map((row) => row.count));
  const labelLine = Math.round(font * 1.35);
  const barHeight = Math.max(22, Math.round(font * 0.9));
  const rowHeight = labelLine + barHeight + 16;
  const values = rows.map((row) => `${row.count} (${formatPercent(row.percent, 1)})`);
  const valueWidth = Math.max(0, ...values.map((value) => textWidth(value, font)));
  const barMax = Math.max(80, 800 - valueWidth - 8);
  const height = 10 + rows.length * rowHeight + 30;

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 800 ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      {rows.map((row, index) => {
        const top = 6 + index * rowHeight;
        const barY = top + labelLine;
        const width = (row.count / max) * barMax;
        return (
          <g key={row.value}>
            {/* La categoría va sobre la barra: a la izquierda no caben nombres
                largos cuando la fuente crece. */}
            <text x={0} y={top + labelLine * 0.82} className="lab-axis-label">
              {row.value}
            </text>
            <rect x={0} y={barY} width={barMax} height={barHeight} fill="var(--grid)" opacity="0.45" />
            <rect
              x={0}
              y={barY}
              width={Math.max(2, width)}
              height={barHeight}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              opacity="0.82"
            />
            <text
              x={Math.max(2, width) + 6}
              y={barY + barHeight / 2 + font * 0.35}
              className="lab-axis-label"
            >
              {values[index] ?? ""}
            </text>
          </g>
        );
      })}
      <text x={0} y={height - 8} className="lab-axis-label">
        {label}
      </text>
    </svg>
  );
}

export function HistogramChart({
  rows,
  mean,
  label,
  unit,
  ariaLabel,
}: {
  rows: readonly GroupedFrequencyRow[];
  mean: number | null;
  label: string;
  unit: string | null;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  if (rows.length === 0) return <ChartEmpty />;
  const width = 800;
  const height = 360;
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const left = Math.max(58, 16 + String(maxCount).length * 0.6 * font);
  const right = 20;
  const top = 28;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barWidth = plotWidth / rows.length;
  const min = rows[0]?.lower ?? 0;
  const max = rows[rows.length - 1]?.upper ?? 1;
  const range = max - min || 1;
  const meanX = mean === null ? null : left + ((mean - min) / range) * plotWidth;
  const y = (count: number) => top + plotHeight - (count / maxCount) * plotHeight;
  const polygonPoints = rows
    .map((row, index) => `${left + index * barWidth + barWidth / 2},${y(row.count)}`)
    .join(" ");
  const xLabels = rows.map((row) => formatNumber(row.lower, 1));
  const labelWidth = Math.max(0, ...xLabels.map((value) => textWidth(value, font)));
  const stride = tickStride(labelWidth, barWidth);
  const meanOnRight = meanX !== null && meanX > left + plotWidth * 0.6;

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <desc>
        Histograma de {label} con polígono de frecuencias. Barras para la frecuencia absoluta y
        línea para el polígono.
      </desc>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const tick = Math.round(maxCount * (1 - fraction));
        const lineY = top + plotHeight * fraction;
        return (
          <g key={fraction}>
            <line x1={left} x2={width - right} y1={lineY} y2={lineY} className="lab-grid-line" />
            <text x={left - 8} y={lineY + 3} textAnchor="end" className="lab-axis-label">
              {tick}
            </text>
          </g>
        );
      })}
      {rows.map((row, index) => {
        const barH = plotHeight - (y(row.count) - top);
        return (
          <g key={`${row.lower}-${row.upper}`}>
            <rect
              x={left + index * barWidth + 1}
              y={y(row.count)}
              width={Math.max(2, barWidth - 2)}
              height={Math.max(1, barH)}
              fill="var(--accent)"
              opacity="0.24"
              stroke="var(--accent)"
              strokeOpacity="0.55"
            />
            {index % stride === 0 ? (
              <text
                x={left + index * barWidth + barWidth / 2}
                y={height - 38}
                textAnchor="middle"
                className="lab-axis-label"
              >
                {xLabels[index] ?? ""}
              </text>
            ) : null}
            <title>
              {formatInterval(row.lower, row.upper)}: {row.count} casos
            </title>
          </g>
        );
      })}
      <polyline
        points={polygonPoints}
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth={Math.max(2, font * 0.13)}
        strokeOpacity="0.9"
      />
      {rows.map((row, index) => (
        <circle
          key={`point-${row.lower}-${row.upper}`}
          cx={left + index * barWidth + barWidth / 2}
          cy={y(row.count)}
          r={Math.max(3.2, font * 0.2)}
          fill="var(--accent-2)"
        />
      ))}
      {meanX !== null ? (
        <g>
          <line
            x1={meanX}
            x2={meanX}
            y1={top}
            y2={top + plotHeight}
            stroke="var(--warning)"
            strokeDasharray="4 4"
            strokeWidth={hairline(font) * 1.4}
          />
          <text
            x={meanX + (meanOnRight ? -5 : 5)}
            y={top + 12}
            textAnchor={meanOnRight ? "end" : "start"}
            className="lab-axis-label"
          >
            media {formatNumber(mean, 1)}
          </text>
        </g>
      ) : null}
      <line
        x1={left}
        x2={width - right}
        y1={top + plotHeight}
        y2={top + plotHeight}
        stroke="var(--border-strong)"
        strokeWidth={hairline(font)}
      />
      <text x={left} y={height - 10} className="lab-axis-label">
        {label}
        {unit ? ` (${unit})` : ""}
      </text>
    </svg>
  );
}

export function PieChart({
  rows,
  label,
  ariaLabel,
}: {
  rows: readonly FrequencyRow[];
  label: string;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <ChartEmpty />;
  const width = 800;
  const outer = 125;
  const inner = 70;
  const cx = 400;
  const cy = outer + 20;
  const legendTop = cy + outer + 30;
  const legendRow = Math.max(28, Math.round(font * 1.55));
  const chip = Math.max(12, Math.round(font * 0.9));
  const height = legendTop + rows.length * legendRow + 16;
  let angle = -Math.PI / 2;
  const slices = rows.map((row, index) => {
    const start = angle;
    const sweep = (row.count / total) * Math.PI * 2;
    angle += sweep;
    return { ...row, start, end: start + sweep, color: CHART_COLORS[index % CHART_COLORS.length] };
  });

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <desc>Composición porcentual de {label}.</desc>
      {slices.length === 1 ? (
        <>
          <circle cx={cx} cy={cy} r={outer} fill={slices[0]?.color} />
          <circle cx={cx} cy={cy} r={inner} fill="var(--surface)" />
        </>
      ) : (
        slices.map((slice) => (
          <path
            key={slice.value}
            d={donutSlice(cx, cy, outer, inner, slice.start, slice.end)}
            fill={slice.color}
            stroke="var(--surface)"
            strokeWidth="2"
          >
            <title>
              {slice.value}: {slice.count} casos ({formatPercent(slice.percent, 1)})
            </title>
          </path>
        ))
      )}
      <text
        x={cx}
        y={cy - font * 0.4}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={font * 2.6}
        fill="var(--text)"
      >
        {total}
      </text>
      {font <= 16 ? (
        <text x={cx} y={cy + font * 1.6} textAnchor="middle" className="lab-axis-label">
          estudiantes
        </text>
      ) : null}
      {/* La leyenda vive debajo del anillo: a un lado, los nombres largos se
          salen del lienzo cuando la fuente crece. */}
      {rows.map((row, index) => {
        const y = legendTop + index * legendRow;
        return (
          <g key={`legend-${row.value}`}>
            <rect
              x={8}
              y={y - chip * 0.85}
              width={chip}
              height={chip}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
            <text x={8 + chip + 8} y={y} className="lab-axis-label">
              {row.value}
            </text>
            <text x={792} y={y} textAnchor="end" className="lab-axis-label">
              {row.count} · {formatPercent(row.percent, 1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ScatterChart({
  points,
  regression,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  ariaLabel,
}: {
  points: readonly { x: number; y: number }[];
  regression: RegressionResult | null;
  xLabel: string;
  yLabel: string;
  xUnit?: string | null;
  yUnit?: string | null;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  if (points.length < 3 || !regression) return <ChartEmpty />;
  const width = 800;
  const height = 400;
  const right = 22;
  const top = Math.max(24, Math.round(font * 1.5));
  const bottom = 62;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const fractions = [0, 0.25, 0.5, 0.75, 1];
  const xTickLabels = fractions.map((fraction) => formatNumber(minX + xRange * fraction, 0));
  const yTickLabels = fractions.map((fraction) => formatNumber(minY + yRange * fraction, 0));
  const left = Math.max(
    64,
    16 + Math.max(0, ...yTickLabels.map((value) => textWidth(value, font))),
  );
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xStride = tickStride(
    Math.max(0, ...xTickLabels.map((value) => textWidth(value, font))),
    plotWidth / (fractions.length - 1),
  );
  const x = (value: number) => left + ((value - minX) / xRange) * plotWidth;
  const y = (value: number) => top + plotHeight - ((value - minY) / yRange) * plotHeight;

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <desc>
        Dispersión de {xLabel} y {yLabel}, con recta de regresión ajustada.
      </desc>
      {/* La etiqueta del eje Y va horizontal arriba: rotada, con fuente grande
          se sale del lienzo. */}
      <text x={0} y={top - 10} className="lab-axis-label">
        {yLabel}
        {yUnit ? ` (${yUnit})` : ""}
      </text>
      {fractions.map((fraction, index) => {
        const xValue = minX + xRange * fraction;
        const yValue = minY + yRange * fraction;
        const showX = index % xStride === 0 || index === fractions.length - 1;
        return (
          <g key={fraction}>
            <line
              x1={left}
              x2={width - right}
              y1={y(yValue)}
              y2={y(yValue)}
              className="lab-grid-line"
            />
            <line
              x1={x(xValue)}
              x2={x(xValue)}
              y1={top}
              y2={top + plotHeight}
              className="lab-grid-line"
            />
            <text x={left - 8} y={y(yValue) + 3} textAnchor="end" className="lab-axis-label">
              {yTickLabels[index] ?? ""}
            </text>
            {showX ? (
              <text x={x(xValue)} y={height - 38} textAnchor="middle" className="lab-axis-label">
                {xTickLabels[index] ?? ""}
              </text>
            ) : null}
          </g>
        );
      })}
      <line
        x1={left}
        x2={width - right}
        y1={top + plotHeight}
        y2={top + plotHeight}
        stroke="var(--border-strong)"
        strokeWidth={hairline(font)}
      />
      <line
        x1={left}
        x2={left}
        y1={top}
        y2={top + plotHeight}
        stroke="var(--border-strong)"
        strokeWidth={hairline(font)}
      />
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={x(point.x)}
          cy={y(point.y)}
          r={Math.max(3.6, font * 0.26)}
          fill="var(--accent)"
          opacity="0.62"
        >
          <title>
            {xLabel}: {formatNumber(point.x, 1)} {xUnit ?? ""}. {yLabel}:{" "}
            {formatNumber(point.y, 1)} {yUnit ?? ""}.
          </title>
        </circle>
      ))}
      <line
        x1={x(regression.xMin)}
        y1={y(regression.intercept + regression.slope * regression.xMin)}
        x2={x(regression.xMax)}
        y2={y(regression.intercept + regression.slope * regression.xMax)}
        stroke="var(--accent-2)"
        strokeWidth={Math.max(2.4, font * 0.14)}
        opacity="0.9"
      />
      <text x={left} y={height - 10} className="lab-axis-label">
        {xLabel}
        {xUnit ? ` (${xUnit})` : ""}
      </text>
    </svg>
  );
}

export function ComparisonChart({
  groups,
  label,
  unit,
  ariaLabel,
}: {
  groups: readonly { label: string; n: number; mean: number | null }[];
  label: string;
  unit: string | null;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  const valid = groups.filter((group) => group.mean !== null);
  if (valid.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...valid.map((group) => group.mean ?? 0));
  const labelLine = Math.round(font * 1.35);
  const barHeight = Math.max(24, Math.round(font * 0.95));
  const rowHeight = labelLine + barHeight + 16;
  const values = valid.map((group) =>
    unit ? `${formatNumber(group.mean, 1)} ${unit}` : formatNumber(group.mean, 1),
  );
  const valueWidth = Math.max(0, ...values.map((value) => textWidth(value, font)));
  const barMax = Math.max(80, 800 - valueWidth - 8);
  const height = 10 + valid.length * rowHeight + 30;

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 800 ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <desc>Promedio académico medio por {label}.</desc>
      {valid.map((group, index) => {
        const top = 6 + index * rowHeight;
        const barY = top + labelLine;
        const width = ((group.mean ?? 0) / max) * barMax;
        return (
          <g key={group.label}>
            <text x={0} y={top + labelLine * 0.82} className="lab-axis-label">
              {group.label}
            </text>
            <rect x={0} y={barY} width={barMax} height={barHeight} fill="var(--grid)" opacity="0.45" />
            <rect
              x={0}
              y={barY}
              width={Math.max(2, width)}
              height={barHeight}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              opacity="0.72"
            />
            <text
              x={Math.max(2, width) + 6}
              y={barY + barHeight / 2 + font * 0.35}
              className="lab-axis-label"
            >
              {values[index] ?? ""}
            </text>
          </g>
        );
      })}
      <text x={0} y={height - 8} className="lab-axis-label">
        {label}
      </text>
    </svg>
  );
}

export function FiveNumberChart({
  summary,
  ariaLabel,
}: {
  summary: DescriptiveSummary;
  ariaLabel: string;
}) {
  const { svgRef, font } = useChartBox();
  const { min, max, q1, median, q3 } = summary;
  if (min === null || max === null || q1 === null || median === null || q3 === null) {
    return <ChartEmpty />;
  }
  const width = 760;
  const padding = 54;
  const boxHeight = Math.max(30, font);
  const baseY = 48;
  const range = max - min;
  const scale = (value: number) =>
    range === 0 ? width / 2 : padding + ((value - min) / range) * (width - padding * 2);
  const minX = scale(min);
  const q1X = scale(q1);
  const medianX = scale(median);
  const q3X = scale(q3);
  const maxX = scale(max);
  const labelY = baseY + boxHeight / 2 + font * 1.15;
  const valueY = labelY + font * 1.3;
  const height = valueY + font * 0.6 + 10;
  const ticks = [
    { x: minX, label: "Mín", value: min },
    { x: q1X, label: "Q1", value: q1 },
    { x: medianX, label: "Mediana", value: median },
    { x: q3X, label: "Q3", value: q3 },
    { x: maxX, label: "Máx", value: max },
  ];
  // Cuando dos cuantiles quedan cerca, la etiqueta de uno tapa a la otra:
  // se muestra la primera que cabe.
  let lastRight = -Infinity;
  const visibleTicks = ticks.filter((tick) => {
    const half =
      Math.max(textWidth(tick.label, font), textWidth(formatNumber(tick.value, 1), font)) / 2;
    if (tick.x - half < lastRight + 6) return false;
    lastRight = tick.x + half;
    return true;
  });

  return (
    <svg
      ref={svgRef}
      style={{ fontSize: font }}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <line x1={padding} x2={width - padding} y1={baseY} y2={baseY} stroke="var(--border-strong)" />
      <line x1={minX} x2={q1X} y1={baseY} y2={baseY} stroke="var(--muted)" />
      <line x1={q3X} x2={maxX} y1={baseY} y2={baseY} stroke="var(--muted)" />
      <line x1={minX} x2={minX} y1={baseY - 10} y2={baseY + 10} stroke="var(--muted)" />
      <line x1={maxX} x2={maxX} y1={baseY - 10} y2={baseY + 10} stroke="var(--muted)" />
      <rect
        x={Math.min(q1X, q3X)}
        y={baseY - boxHeight / 2}
        width={Math.max(2, Math.abs(q3X - q1X))}
        height={boxHeight}
        fill="var(--accent)"
        fillOpacity="0.14"
        stroke="var(--accent)"
      />
      <line
        x1={medianX}
        x2={medianX}
        y1={baseY - boxHeight / 2}
        y2={baseY + boxHeight / 2}
        stroke="var(--accent-2)"
        strokeWidth="2.5"
      />
      {visibleTicks.map((tick) => (
        <g key={tick.label}>
          <text x={tick.x} y={labelY} textAnchor="middle" className="lab-axis-label">
            {tick.label}
          </text>
          <text x={tick.x} y={valueY} textAnchor="middle" className="lab-axis-label">
            {formatNumber(tick.value, 1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ChartEmpty() {
  return (
    <div className="flex min-h-40 items-center justify-center border border-dashed border-border px-4 text-center text-xs text-muted">
      No hay datos suficientes para dibujar este gráfico.
    </div>
  );
}

function donutSlice(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
): string {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, outer, start);
  const p2 = polar(cx, cy, outer, end);
  const p3 = polar(cx, cy, inner, end);
  const p4 = polar(cx, cy, inner, start);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}