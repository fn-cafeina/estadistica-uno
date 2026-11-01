import { useMemo } from "react";
import { ArrowLeft, Database } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { getCategories, getCategoricalValue } from "../../data/schema";
import { pearsonCorrelation } from "../../stats/correlation";
import { chiSquareTest } from "../../stats/chiSquare";
import { formatPValue } from "../../lib/format";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { SceneFrame, type SceneProps } from "../SceneFrame";

const IDEAS = [
  {
    title: "La muestra describe, no representa",
    text: "Los resultados valen para este ejercicio, no para toda la universidad.",
  },
  {
    title: "La relación no es determinante",
    text: "La recta orienta, pero no explica el promedio de cada estudiante.",
  },
  {
    title: "Asociación no es causalidad",
    text: "Dos variables pueden moverse juntas sin que una cause a la otra.",
  },
];

export function ClosingScene({ onRestart, onOpenData }: SceneProps) {
  const { sample } = useSample();

  const correlation = useMemo(
    () =>
      pearsonCorrelation(
        sample.rows.map((row) => row.studyHours),
        sample.rows.map((row) => row.gpa),
      ),
    [sample],
  );

  const chi = useMemo(
    () =>
      chiSquareTest(
        sample.rows.map((row) => ({
          row: getCategoricalValue(row, "studyTechFrequency"),
          col: getCategoricalValue(row, "performanceLevel"),
        })),
        getCategories("studyTechFrequency"),
        getCategories("performanceLevel"),
        0.05,
      ),
    [sample],
  );

  return (
    <SceneFrame
      kicker="09 / CONCLUSIÓN"
      title={<>Los datos <em>no hablan solos</em>.</>}
      insight="Tres conclusiones de esta muestra. El resto es contexto, supuestos y decisiones."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="deck-control deck-control-primary" onClick={onRestart}>
            <ArrowLeft aria-hidden="true" size={15} />
            Volver al inicio
          </button>
          {onOpenData ? (
            <button type="button" className="deck-control" onClick={onOpenData}>
              <Database aria-hidden="true" size={15} />
              Ver datos
            </button>
          ) : null}
          <span className="ml-auto font-display text-2xl text-fg">Gracias.</span>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <div className="grid gap-5 sm:grid-cols-3">
          {IDEAS.map((idea, index) => (
            <div key={idea.title} className="deck-slab">
              <p className="font-mono text-[0.65rem] text-accent">0{index + 1}</p>
              <h3 className="mt-2 max-w-[18ch] font-display text-2xl leading-tight text-fg sm:text-3xl">
                {idea.title}
              </h3>
              <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">{idea.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-6">
          <div>
            <p className="deck-label">Registros</p>
            <p className="deck-stat deck-stat-sm mt-1 text-fg">
              <AnimatedNumber value={sample.n} digits={0} />
            </p>
          </div>
          <div>
            <p className="deck-label">Correlación</p>
            <p className="deck-stat deck-stat-sm mt-1 text-accent">
              <AnimatedNumber value={correlation?.r} digits={2} />
            </p>
          </div>
          <div>
            <p className="deck-label">Valor p</p>
            <p className="deck-stat deck-stat-sm mt-1 text-accent">
              {chi ? formatPValue(chi.pValue) : "s/d"}
            </p>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
