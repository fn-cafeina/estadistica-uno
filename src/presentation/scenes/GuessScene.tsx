import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { pearsonCorrelation } from "../../stats/correlation";
import { formatNumber, formatSigned } from "../../lib/format";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { SceneFrame, cn, type SceneProps } from "../SceneFrame";

function GuessScale({
  guess,
  actual,
  revealed,
}: {
  guess: number;
  actual: number | null;
  revealed: boolean;
}) {
  const guessPosition = ((guess + 1) / 2) * 100;
  const actualPosition = actual === null ? 0 : ((actual + 1) / 2) * 100;

  return (
    <div className="w-full">
      <div className="relative h-24">
        <div className="absolute inset-x-0 top-10 h-px bg-border-strong" />
        <div className="absolute left-0 top-[2.05rem] h-2 w-px bg-danger/60" />
        <div className="absolute right-0 top-[2.05rem] h-2 w-px bg-success/60" />
        <div className="absolute left-1/2 top-[2.05rem] h-2 w-px bg-muted/50" />

        <div
          className="absolute top-5 -translate-x-1/2"
          style={{ left: `${guessPosition}%` }}
        >
          <span className="block h-10 w-px bg-accent" />
          <span className="absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap rounded-[1px] border border-accent/40 bg-surface px-2 py-1 font-mono text-[0.58rem] font-medium uppercase tracking-[0.06em] text-accent">
            tu apuesta {formatSigned(guess)}
          </span>
        </div>

        {revealed && actual !== null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute top-3 -translate-x-1/2"
            style={{ left: `${actualPosition}%` }}
          >
            <span className="block h-14 w-0.5 bg-success" />
            <span className="absolute left-1/2 top-[3.7rem] -translate-x-1/2 whitespace-nowrap rounded-[1px] border border-success/40 bg-surface px-2 py-1 font-mono text-[0.58rem] font-medium uppercase tracking-[0.06em] text-success">
              r real {formatSigned(actual)}
            </span>
          </motion.div>
        ) : null}
      </div>
      <div className="mt-1 flex justify-between text-[0.62rem] uppercase tracking-[0.1em] text-faint">
        <span>-1 negativa</span>
        <span>0 sin relación</span>
        <span>1 positiva</span>
      </div>
    </div>
  );
}

export function GuessScene({ onNext }: SceneProps) {
  const { sample } = useSample();
  const reduced = useReducedMotion();
  const [guess, setGuess] = useState(0.5);
  const [revealed, setRevealed] = useState(false);

  const correlation = useMemo(
    () =>
      pearsonCorrelation(
        sample.rows.map((row) => row.studyHours),
        sample.rows.map((row) => row.gpa),
      ),
    [sample],
  );

  const actual = correlation?.r ?? null;
  const distance = actual === null ? null : Math.abs(guess - actual);

  return (
    <SceneFrame
      kicker="02 / LA APUESTA"
      title={<>Antes de mirar los datos, <em>apostá</em>.</>}
      insight="¿Qué correlación esperás entre horas de estudio y promedio? Pedí un número en voz alta y mové el slider."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {revealed ? (
            <button type="button" className="deck-control deck-control-primary" onClick={onNext}>
              Seguir
              <ArrowRight aria-hidden="true" size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="deck-control deck-control-primary"
              onClick={() => setRevealed(true)}
            >
              Revelar
            </button>
          )}
          <button
            type="button"
            className="deck-control"
            onClick={() => {
              setRevealed(false);
              setGuess(0.5);
            }}
          >
            <RotateCcw aria-hidden="true" size={14} />
            Reiniciar apuesta
          </button>
        </div>
      }
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="deck-label">{revealed ? "Correlación real" : "Tu apuesta"}</p>
          <p
            className={cn("deck-stat mt-2", revealed ? "text-success" : "text-accent")}
            aria-live="polite"
          >
            {revealed ? (
              <AnimatedNumber
                value={actual}
                digits={2}
                prefix={actual !== null && actual > 0 ? "+" : ""}
              />
            ) : (
              formatSigned(guess)
            )}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {revealed && correlation ? (
              <>
                La relación es <span className="text-fg">{correlation.strength}</span> y{" "}
                <span className="text-fg">{correlation.direction}</span>. Tu apuesta quedó a{" "}
                {formatNumber(distance, 2)} unidades del valor real.
              </>
            ) : (
              "Movés el slider y después revelás. No hay respuesta correcta: la idea es comparar lo que esperabas con lo que muestra esta muestra."
            )}
          </p>
        </div>

        <div className="deck-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="deck-label flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" size={13} />
              Apuesta
            </p>
            <span className="font-mono text-xs text-muted">-1 a 1</span>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={guess}
              aria-label="Correlación esperada"
              className="deck-range"
              onChange={(event) => {
                setGuess(Number(event.target.value));
                setRevealed(false);
              }}
            />
          </div>

          <div className="mt-7">
            <GuessScale guess={guess} actual={actual} revealed={revealed} />
          </div>

          {revealed && correlation ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
              className="mt-6 border-t border-border pt-3 text-xs leading-relaxed text-muted"
            >
              r = {formatNumber(correlation.r, 3)}. La recta explica aproximadamente{" "}
              {formatNumber(correlation.r2 * 100, 1)}% de la variabilidad del promedio. Una
              correlación no demuestra causalidad.
            </motion.div>
          ) : null}
        </div>
      </div>
    </SceneFrame>
  );
}
