import { motion, useReducedMotion } from "motion/react";
import { SceneFrame, type SceneProps } from "../SceneFrame";

const MEMBERS = [
  "Jasmir Moisés Medina Pérez",
  "Samuel Santiago Salgado Selva",
  "Gonzalo Javier Blanco Cardoza",
  "Franklin Isaac Aguirre Zamora",
];

export function IntroductionScene(_: SceneProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <SceneFrame
      kicker="02 / INTRODUCCIÓN"
      title={<>Quiénes <em>presentan</em>.</>}
      insight="Una exposición informativa sobre tecnología, datos y rendimiento académico."
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="deck-panel p-5 sm:p-6">
          <p className="deck-fig">Grupo</p>
          <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {MEMBERS.map((name, index) => (
              <motion.li
                key={name}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  delay: reduced ? 0 : 0.08 + index * 0.06,
                }}
                className="border-t border-border pt-2"
              >
                <span className="font-mono text-[0.58rem] text-accent">0{index + 1}</span>
                <span className="mt-1 block font-display text-xl leading-tight text-fg sm:text-2xl">
                  {name}
                </span>
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 border-t border-border pt-4 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-faint">
            UNAN-León · Ingeniería en Sistemas · 2026
          </p>
        </div>

        <div>
          <p className="deck-label">Objetivo</p>
          <p className="mt-3 max-w-[30ch] font-display text-2xl leading-tight text-fg sm:text-3xl">
            Analizar la relación entre el uso de la tecnología y el rendimiento académico.
          </p>
          <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted">
            Una muestra de estudiantes, unos pocos procedimientos y una pregunta que no se agota
            en los números.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="deck-chip">Datos sintéticos</span>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
