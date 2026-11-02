import type { ReactNode } from "react";
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
  if (rows.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...rows.map((row) => row.count));
  const rowHeight = 34;
  const height = rows.length * rowHeight + 54;
  const labelX = 160;
  const barX = 174;
  const barMax = 548;

  return (
    <svg viewBox={`0 0 800 ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <title>{ariaLabel}</title>
      {rows.map((row, index) => {
        const y = 20 + index * rowHeight;
        const width = (row.count / max) * barMax;
        return (
          <g key={row.value}>
            <text x={labelX} y={y + 17} textAnchor="end" className="lab-axis-label">
              {row.value}
            </text>
            <rect
              x={barX}
              y={y}
              width={barMax}
              height={22}
              fill="var(--grid)"
              opacity="0.45"
            />
            <rect
              x={barX}
              y={y}
              width={Math.max(2, width)}
              height={22}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              opacity="0.82"
            />
            <text x={barX + width + 6} y={y + 16} className="lab-axis-label">
              {row.count} ({formatPercent(row.percent, 1)})
            </text>
          </g>
        );
      })}
      <line x1={barX} x2={barX} y1="10" y2={height - 38} stroke="var(--border-strong)" />
      <text x={barX} y={height - 10} className="lab-axis-label">
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
  if (rows.length === 0) return <ChartEmpty />;
  const width = 800;
  const height = 360;
  const left = 58;
  const right = 20;
  const top = 28;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const barWidth = plotWidth / rows.length;
  const min = rows[0]?.lower ?? 0;
  const max = rows[rows.length - 1]?.upper ?? 1;
  const range = max - min || 1;
  const meanX = mean === null ? null : left + ((mean - min) / range) * plotWidth;
  const y = (count: number) => top + plotHeight - (count / maxCount) * plotHeight;
  const polygonPoints = rows
    .map((row, index) => `${left + index * barWidth + barWidth / 2},${y(row.count)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
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
            <text
              x={left + index * barWidth + barWidth / 2}
              y={height - 38}
              textAnchor="middle"
              className="lab-axis-label"
            >
              {formatNumber(row.lower, 1)}
            </text>
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
        strokeWidth="2"
        strokeOpacity="0.9"
      />
      {rows.map((row, index) => (
        <circle
          key={`point-${row.lower}-${row.upper}`}
          cx={left + index * barWidth + barWidth / 2}
          cy={y(row.count)}
          r="3.2"
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
          />
          <text x={meanX + 5} y={top + 10} className="lab-axis-label">
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
      />
      <text x={left} y={height - 10} className="lab-axis-label">
        {label}
        {unit ? ` (${unit})` : ""}
      </text>
      <text x={width - right} y={top + 12} textAnchor="end" className="lab-axis-label">
        Barras: frecuencia · Línea: polígono
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
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <ChartEmpty />;
  const width = 800;
  const height = 360;
  const cx = 245;
  const cy = 175;
  const outer = 125;
  const inner = 70;
  let angle = -Math.PI / 2;
  const slices = rows.map((row, index) => {
    const start = angle;
    const sweep = (row.count / total) * Math.PI * 2;
    angle += sweep;
    return { ...row, start, end: start + sweep, color: CHART_COLORS[index % CHART_COLORS.length] };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
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
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="28" fill="var(--text)">
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="lab-axis-label">
        estudiantes
      </text>
      {rows.map((row, index) => {
        const y = 64 + index * 34;
        return (
          <g key={`legend-${row.value}`}>
            <rect
              x={445}
              y={y - 12}
              width={12}
              height={12}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
            <text x={465} y={y - 2} className="lab-axis-label">
              {row.value}
            </text>
            <text x={770} y={y - 2} textAnchor="end" className="lab-axis-label">
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
  if (points.length < 3 || !regression) return <ChartEmpty />;
  const width = 800;
  const height = 400;
  const left = 64;
  const right = 22;
  const top = 24;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const x = (value: number) => left + ((value - minX) / xRange) * plotWidth;
  const y = (value: number) => top + plotHeight - ((value - minY) / yRange) * plotHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <title>{ariaLabel}</title>
      <desc>
        Dispersión de {xLabel} y {yLabel}, con recta de regresión ajustada.
      </desc>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const xValue = minX + xRange * fraction;
        const yValue = minY + yRange * fraction;
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
              {formatNumber(yValue, 0)}
            </text>
            <text x={x(xValue)} y={height - 38} textAnchor="middle" className="lab-axis-label">
              {formatNumber(xValue, 0)}
            </text>
          </g>
        );
      })}
      <line
        x1={left}
        x2={width - right}
        y1={top + plotHeight}
        y2={top + plotHeight}
        stroke="var(--border-strong)"
      />
      <line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="var(--border-strong)" />
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={x(point.x)}
          cy={y(point.y)}
          r="3.6"
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
        strokeWidth="2.4"
        opacity="0.9"
      />
      <text x={left} y={height - 10} className="lab-axis-label">
        {xLabel}
        {xUnit ? ` (${xUnit})` : ""}
      </text>
      <text
        x={16}
        y={top + plotHeight}
        transform={`rotate(-90 16 ${top + plotHeight})`}
        className="lab-axis-label"
      >
        {yLabel}
        {yUnit ? ` (${yUnit})` : ""}
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
  const valid = groups.filter((group) => group.mean !== null);
  if (valid.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...valid.map((group) => group.mean ?? 0));
  const rowHeight = 40;
  const height = valid.length * rowHeight + 54;
  const barX = 190;
  const barMax = 520;

  return (
    <svg viewBox={`0 0 800 ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <title>{ariaLabel}</title>
      <desc>Promedio académico medio por {label}.</desc>
      {valid.map((group, index) => {
        const y = 20 + index * rowHeight;
        const width = ((group.mean ?? 0) / max) * barMax;
        return (
          <g key={group.label}>
            <text x={barX - 8} y={y + 17} textAnchor="end" className="lab-axis-label">
              {group.label}
            </text>
            <rect x={barX} y={y} width={barMax} height={24} fill="var(--grid)" opacity="0.45" />
            <rect
              x={barX}
              y={y}
              width={Math.max(2, width)}
              height={24}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              opacity="0.72"
            />
            <text x={barX + width + 6} y={y + 17} className="lab-axis-label">
              {formatNumber(group.mean, 1)} {unit ?? ""}
            </text>
          </g>
        );
      })}
      <text x={barX} y={height - 10} className="lab-axis-label">
        {label}
      </text>
    </svg>
  );
}

export function FiveNumberChart({
  summary,
  unit,
  ariaLabel,
}: {
  summary: DescriptiveSummary;
  unit: string | null;
  ariaLabel: string;
}) {
  const { min, max, q1, median, q3 } = summary;
  if (min === null || max === null || q1 === null || median === null || q3 === null) {
    return <ChartEmpty />;
  }
  const width = 760;
  const height = 120;
  const padding = 54;
  const baseY = 48;
  const range = max - min;
  const scale = (value: number) =>
    range === 0 ? width / 2 : padding + ((value - min) / range) * (width - padding * 2);
  const minX = scale(min);
  const q1X = scale(q1);
  const medianX = scale(median);
  const q3X = scale(q3);
  const maxX = scale(max);
  const boxHeight = 30;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
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
      {[
        { x: minX, label: "Mín", value: min },
        { x: q1X, label: "Q1", value: q1 },
        { x: medianX, label: "Mediana", value: median },
        { x: q3X, label: "Q3", value: q3 },
        { x: maxX, label: "Máx", value: max },
      ].map((tick) => (
        <g key={tick.label}>
          <text x={tick.x} y={88} textAnchor="middle" className="lab-axis-label">
            {tick.label}
          </text>
          <text x={tick.x} y={104} textAnchor="middle" className="lab-axis-label">
            {formatNumber(tick.value, 1)} {unit ?? ""}
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
