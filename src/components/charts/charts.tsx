import "./chartSetup";
import { useMemo } from "react";
import { Chart, Doughnut } from "react-chartjs-2";
import type { ChartData, ChartOptions, Plugin } from "chart.js";
import { useReducedMotion } from "motion/react";
import { useApp } from "../../state/AppContext";
import type { FrequencyRow, GroupedFrequencyRow } from "../../stats/frequency";
import type { CorrelationResult } from "../../stats/correlation";
import type { RegressionResult } from "../../stats/regression";
import { predictValue } from "../../stats/regression";
import { formatInteger, formatInterval, formatNumber, formatPercent } from "../../lib/format";
import { readChartTokens, tooltipStyle, withAlpha, type ChartTokens } from "./chartTheme";

const CHART_FONT = '"Inter Variable", ui-sans-serif, system-ui, sans-serif';

function useChartTokens(): ChartTokens {
  const { state } = useApp();
  return useMemo(() => readChartTokens(state.printing), [state.theme, state.printing]);
}

function useChartAnimation() {
  const reduced = useReducedMotion();
  return {
    reduced: Boolean(reduced),
    animation: reduced ? (false as const) : { duration: 650, easing: "easeOutQuart" as const },
  };
}

function baseBarOptions(
  tokens: ChartTokens,
  reduced: boolean,
  xTitle: string,
  yTitle: string,
  horizontal = false,
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    animation: reduced ? false : { duration: 650, easing: "easeOutQuart" },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { display: false, labels: { color: tokens.muted } },
      tooltip: tooltipStyle(tokens),
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: tokens.grid, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 }, maxRotation: 0, autoSkip: true },
        title: {
          display: Boolean(xTitle),
          text: xTitle,
          color: tokens.muted,
          font: { size: 10, weight: 600 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: tokens.grid, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 }, autoSkip: true },
        title: {
          display: Boolean(yTitle),
          text: yTitle,
          color: tokens.muted,
          font: { size: 10, weight: 600 },
        },
      },
    },
  };
}

export function BarFrequencyChart({ rows, label }: { rows: readonly FrequencyRow[]; label: string }) {
  const tokens = useChartTokens();
  const { reduced } = useChartAnimation();

  const data: ChartData<"bar"> = {
    labels: rows.map((row) => row.value),
    datasets: [
      {
        label: "Estudiantes",
        data: rows.map((row) => row.count),
        backgroundColor: rows.map((_, index) =>
          withAlpha(tokens.chart[index % tokens.chart.length] ?? tokens.accent, 0.7),
        ),
        borderColor: rows.map((_, index) => tokens.chart[index % tokens.chart.length] ?? tokens.accent),
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 26,
      },
    ],
  };

  const options = baseBarOptions(tokens, reduced, "Frecuencia absoluta", label, true);
  options.plugins = {
    ...options.plugins,
    tooltip: {
      ...tooltipStyle(tokens),
      callbacks: {
        label: (context) => {
          const row = rows[context.dataIndex];
          return row ? `${row.count} estudiantes (${formatPercent(row.percent)})` : "";
        },
      },
    },
  };

  return (
    <Chart
      type="bar"
      data={data}
      options={options}
      aria-label={`Gráfico de barras de frecuencia de ${label}`}
      role="img"
    />
  );
}

export function HistogramChart({
  rows,
  label,
  unit,
}: {
  rows: readonly GroupedFrequencyRow[];
  label: string;
  unit: string | null;
}) {
  const tokens = useChartTokens();
  const { reduced } = useChartAnimation();

  const labels = rows.map((row) => formatInterval(row.lower, row.upper));
  const data = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Histograma",
        data: rows.map((row) => row.count),
        backgroundColor: withAlpha(tokens.accent, 0.55),
        borderColor: tokens.accent,
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 54,
        order: 2,
      },
      {
        type: "line" as const,
        label: "Polígono de frecuencias",
        data: rows.map((row) => row.count),
        borderColor: tokens.accent2,
        backgroundColor: tokens.accent2,
        pointBackgroundColor: tokens.accent2,
        pointBorderColor: tokens.surface,
        pointBorderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        order: 1,
      },
    ],
  } as unknown as ChartData<"bar">;

  const options = baseBarOptions(
    tokens,
    reduced,
    unit ? `${label} (${unit})` : label,
    "Frecuencia absoluta",
  );
  options.plugins = {
    ...options.plugins,
    legend: {
      display: true,
      labels: {
        color: tokens.muted,
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
      },
    },
    tooltip: {
      ...tooltipStyle(tokens),
      callbacks: {
        label: (context) => {
          const row = rows[context.dataIndex];
          if (!row) return "";
          return `${context.dataset.label ?? "Frecuencia"}: ${row.count} (${formatPercent(row.percent)})`;
        },
      },
    },
  };
  options.scales = {
    ...options.scales,
    x: {
      ...options.scales?.x,
      ticks: {
        color: tokens.muted,
        font: { size: 9 },
        maxRotation: 35,
        autoSkip: true,
      },
    },
  };

  return (
    <Chart
      type="bar"
      data={data}
      options={options}
      aria-label={`Histograma y polígono de frecuencias de ${label}`}
      role="img"
    />
  );
}

function centerTextPlugin(total: number, label: string, tokens: ChartTokens): Plugin<"doughnut"> {
  return {
    id: "centerText",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = tokens.text;
      ctx.font = `600 24px ${CHART_FONT}`;
      ctx.fillText(formatInteger(total), x, y - 7);
      ctx.fillStyle = tokens.muted;
      ctx.font = `500 11px ${CHART_FONT}`;
      ctx.fillText(label, x, y + 16);
      ctx.restore();
    },
  };
}

export function DoughnutChart({
  rows,
  label,
  total,
}: {
  rows: readonly FrequencyRow[];
  label: string;
  total: number;
}) {
  const tokens = useChartTokens();
  const { reduced } = useChartAnimation();

  const data: ChartData<"doughnut"> = {
    labels: rows.map((row) => row.value),
    datasets: [
      {
        label: "Estudiantes",
        data: rows.map((row) => row.count),
        backgroundColor: rows.map(
          (_, index) => tokens.chart[index % tokens.chart.length] ?? tokens.accent,
        ),
        borderColor: tokens.surface,
        borderWidth: 2,
        hoverOffset: 7,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: reduced ? false : { duration: 700, easing: "easeOutQuart" },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: tokens.muted,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { size: 10 },
        },
      },
      tooltip: {
        ...tooltipStyle(tokens),
        callbacks: {
          label: (context) => {
            const row = rows[context.dataIndex];
            return row ? `${row.value}: ${row.count} (${formatPercent(row.percent)})` : "";
          },
        },
      },
    },
  };

  return (
    <Doughnut
      data={data}
      options={options}
      plugins={[centerTextPlugin(total, "estudiantes", tokens)]}
      aria-label={`Gráfico circular de ${label}`}
      role="img"
    />
  );
}

export function ScatterRegressionChart({
  correlation,
  regression,
  xLabel,
  xUnit,
  yLabel,
  yUnit,
  mini = false,
}: {
  correlation: CorrelationResult;
  regression: RegressionResult;
  xLabel: string;
  xUnit: string | null;
  yLabel: string;
  yUnit: string | null;
  mini?: boolean;
}) {
  const tokens = useChartTokens();
  const { reduced } = useChartAnimation();

  const lineStart = {
    x: regression.xMin,
    y: predictValue(regression, regression.xMin),
  };
  const lineEnd = {
    x: regression.xMax,
    y: predictValue(regression, regression.xMax),
  };

  const data = {
    datasets: [
      {
        type: "scatter" as const,
        label: "Observaciones",
        data: correlation.points,
        backgroundColor: withAlpha(tokens.accent, mini ? 0.8 : 0.68),
        borderColor: tokens.surface,
        borderWidth: 1,
        pointRadius: mini ? 3 : 4,
        pointHoverRadius: mini ? 4 : 6,
      },
      {
        type: "line" as const,
        label: "Recta ajustada",
        data: [lineStart, lineEnd],
        borderColor: tokens.accent2,
        backgroundColor: tokens.accent2,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  } as unknown as ChartData<"scatter">;

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduced ? false : { duration: 650, easing: "easeOutQuart" },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: {
        display: !mini,
        labels: {
          color: tokens.muted,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
        },
      },
      tooltip: {
        ...tooltipStyle(tokens),
        callbacks: {
          label: (context) => {
            const raw = context.raw as { x?: number; y?: number } | undefined;
            if (!raw || typeof raw.x !== "number" || typeof raw.y !== "number") return "";
            return `${xLabel}: ${formatNumber(raw.x)}${xUnit ? ` ${xUnit}` : ""} · ${yLabel}: ${formatNumber(raw.y)}${yUnit ? ` ${yUnit}` : ""}`;
          },
        },
      },
    },
    scales: mini
      ? {
          x: { display: false },
          y: { display: false },
        }
      : {
          x: {
            type: "linear",
            grid: { color: tokens.grid, drawTicks: false },
            border: { color: tokens.border },
            ticks: { color: tokens.muted, font: { size: 10 } },
            title: {
              display: true,
              text: xUnit ? `${xLabel} (${xUnit})` : xLabel,
              color: tokens.muted,
              font: { size: 10, weight: 600 },
            },
          },
          y: {
            type: "linear",
            grid: { color: tokens.grid, drawTicks: false },
            border: { color: tokens.border },
            ticks: { color: tokens.muted, font: { size: 10 } },
            title: {
              display: true,
              text: yUnit ? `${yLabel} (${yUnit})` : yLabel,
              color: tokens.muted,
              font: { size: 10, weight: 600 },
            },
          },
        },
  };

  return (
    <Chart
      type="scatter"
      data={data}
      options={options}
      aria-label={`Diagrama de dispersión de ${xLabel} y ${yLabel}`}
      role="img"
    />
  );
}

export function ComparisonChart({
  groups,
  variableLabel,
  outcomeLabel,
  outcomeUnit,
}: {
  groups: readonly { label: string; n: number; mean: number | null }[];
  variableLabel: string;
  outcomeLabel: string;
  outcomeUnit: string | null;
}) {
  const tokens = useChartTokens();
  const { reduced } = useChartAnimation();
  const validGroups = groups.filter((group) => group.mean !== null);

  const data: ChartData<"bar"> = {
    labels: validGroups.map((group) => group.label),
    datasets: [
      {
        label: outcomeLabel,
        data: validGroups.map((group) => group.mean ?? 0),
        backgroundColor: validGroups.map((_, index) =>
          withAlpha(tokens.chart[index % tokens.chart.length] ?? tokens.accent, 0.72),
        ),
        borderColor: validGroups.map(
          (_, index) => tokens.chart[index % tokens.chart.length] ?? tokens.accent,
        ),
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 28,
      },
    ],
  };

  const options = baseBarOptions(
    tokens,
    reduced,
    outcomeUnit ? `${outcomeLabel} (${outcomeUnit})` : outcomeLabel,
    variableLabel,
    true,
  );
  options.plugins = {
    ...options.plugins,
    tooltip: {
      ...tooltipStyle(tokens),
      callbacks: {
        label: (context) => {
          const group = validGroups[context.dataIndex];
          return group ? `Media: ${formatNumber(group.mean)} · n = ${group.n}` : "";
        },
      },
    },
  };

  return (
    <Chart
      type="bar"
      data={data}
      options={options}
      aria-label={`Comparación de ${outcomeLabel} según ${variableLabel}`}
      role="img"
    />
  );
}
