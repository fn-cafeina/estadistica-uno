import { motion, useReducedMotion } from "motion/react";
import { linearRegression } from "../../stats/regression";

interface Point {
  x: number;
  y: number;
}

export function PointCloud({
  points,
  className,
}: {
  points: readonly Point[];
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (points.length === 0) return null;

  const width = 720;
  const height = 520;
  const pad = 42;
  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));
  const yMin = Math.min(...points.map((point) => point.y));
  const yMax = Math.max(...points.map((point) => point.y));
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const x = (value: number) => pad + ((value - xMin) / xRange) * (width - pad * 2);
  const y = (value: number) => height - pad - ((value - yMin) / yRange) * (height - pad * 2);

  const regression = linearRegression(
    points.map((point) => point.x),
    points.map((point) => point.y),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="point-cloud-glow" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={width} height={height} fill="url(#point-cloud-glow)" />

      {[0.2, 0.4, 0.6, 0.8].map((fraction) => (
        <g key={fraction}>
          <line
            x1={pad}
            x2={width - pad}
            y1={pad + fraction * (height - pad * 2)}
            y2={pad + fraction * (height - pad * 2)}
            className="deck-grid-line"
          />
          <line
            y1={pad}
            y2={height - pad}
            x1={pad + fraction * (width - pad * 2)}
            x2={pad + fraction * (width - pad * 2)}
            className="deck-grid-line"
          />
        </g>
      ))}

      {regression ? (
        <motion.line
          x1={x(regression.xMin)}
          y1={y(regression.intercept + regression.slope * regression.xMin)}
          x2={x(regression.xMax)}
          y2={y(regression.intercept + regression.slope * regression.xMax)}
          stroke="var(--accent-2)"
          strokeWidth="2"
          strokeOpacity="0.75"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.1, delay: reduced ? 0 : 0.3 }}
        />
      ) : null}

      {points.map((point, index) => (
        <motion.circle
          key={`${point.x}-${point.y}-${index}`}
          cx={x(point.x)}
          cy={y(point.y)}
          r={4}
          fill="var(--accent)"
          fillOpacity={0.62}
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduced ? 0 : 0.45,
            delay: reduced ? 0 : Math.min(0.75, index * 0.012),
          }}
          style={{ transformOrigin: `${x(point.x)}px ${y(point.y)}px` }}
        />
      ))}

      <text x={pad} y={height - 10} className="deck-axis-label">
        Horas de estudio
      </text>
      <text
        x={14}
        y={height - pad}
        className="deck-axis-label"
        transform={`rotate(-90 14 ${height - pad})`}
      >
        Promedio
      </text>
    </svg>
  );
}
