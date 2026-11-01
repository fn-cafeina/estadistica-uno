import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { PointCloud } from "../visuals/PointCloud";
import type { SceneProps } from "../SceneFrame";

export function TitleScene({ onNext }: SceneProps) {
  const { sample } = useSample();
  const reduced = useReducedMotion();
  const points = sample.rows.map((row) => ({ x: row.studyHours, y: row.gpa }));

  return (
    <div className="deck-scene">
      <div className="grid h-full min-h-0 items-center gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:gap-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
          className="relative z-10"
        >
          <p className="deck-kicker">
            <GraduationCap aria-hidden="true" size={14} />
            Estadística Introductoria · 2026
          </p>

          <h1 className="mt-5 max-w-[12ch] font-display text-[clamp(3.35rem,8.1vw,8.6rem)] leading-[0.85] tracking-[-0.04em] text-fg">
            {["Tecnología", "y rendimiento", "académico."].map((line, index) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  initial={reduced ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.72,
                    delay: reduced ? 0 : 0.08 + index * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={
                    index === 1
                      ? "deck-title-underline inline-block italic text-accent"
                      : "inline-block"
                  }
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Una exposición sobre tecnología, datos y rendimiento.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button type="button" className="deck-control deck-control-primary" onClick={onNext}>
              Empezar
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.15 }}
          className="relative hidden h-[62vh] min-h-[20rem] items-center justify-center xl:flex"
        >
          <div className="absolute inset-x-8 top-1/2 h-px bg-border" />
          <PointCloud points={points} className="h-full w-full" />
        </motion.div>
      </div>
    </div>
  );
}
