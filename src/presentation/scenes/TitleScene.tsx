import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, GraduationCap, MousePointer2 } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { PointCloud } from "../visuals/PointCloud";
import type { SceneProps } from "../SceneFrame";

export function TitleScene({ onNext }: SceneProps) {
  const { sample } = useSample();
  const reduced = useReducedMotion();
  const points = sample.rows.map((row) => ({ x: row.studyHours, y: row.gpa }));

  return (
    <div className="deck-scene">
      <div className="grid h-full min-h-0 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
          className="relative z-10"
        >
          <p className="deck-kicker">
            <GraduationCap aria-hidden="true" size={14} />
            UNAN-León · Estadística Introductoria · 2026
          </p>

          <h1 className="mt-5 max-w-[12ch] font-display text-[clamp(3.7rem,9vw,9.4rem)] leading-[0.82] tracking-[-0.05em] text-fg">
            Tecnología y <span className="text-accent">rendimiento</span> académico
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {sample.n} estudiantes que no existen. Una pregunta real.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className="deck-control deck-control-primary" onClick={onNext}>
              Empezar
              <ArrowRight aria-hidden="true" size={16} />
            </button>
            <span className="deck-swipe-hint flex items-center gap-2">
              <MousePointer2 aria-hidden="true" size={13} />
              Flecha derecha para avanzar
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.15 }}
          className="relative hidden h-[62vh] min-h-[20rem] items-center justify-center lg:flex"
        >
          <div className="absolute inset-x-8 top-1/2 h-px bg-border" />
          <PointCloud points={points} className="h-full w-full" />
        </motion.div>
      </div>
    </div>
  );
}
