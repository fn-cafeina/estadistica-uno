import { Sigma } from "lucide-react";
import { SceneFrame, type SceneProps } from "../SceneFrame";

const TECHNOLOGY = ["Horas de pantalla", "Uso para estudiar", "Distracción"];
const PERFORMANCE = ["Promedio de 0 a 100", "Nivel: bajo, medio, alto"];

export function QuestionScene(_: SceneProps) {
  return (
    <SceneFrame
      kicker="03 / LA PREGUNTA"
      title={<>La <em>pregunta</em>.</>}
      insight="Antes de calcular, delimitamos qué vamos a mirar y qué queda fuera."
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="deck-label">Pregunta de investigación</p>
          <p className="mt-4 max-w-[22ch] font-display text-2xl leading-tight text-fg sm:text-3xl">
            ¿Cómo se relaciona el uso de la tecnología con el rendimiento académico universitario?
          </p>
          <div className="deck-slab mt-7">
            <p className="deck-label">Hipótesis de trabajo</p>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">
              Esperamos una asociación débil o moderada, no una relación perfecta.
            </p>
          </div>
        </div>

        <div className="deck-panel p-4 sm:p-5">
          <p className="deck-fig">Variables de la muestra</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="deck-label flex items-center gap-1.5">
                <Sigma aria-hidden="true" size={13} />
                Uso de tecnología
              </p>
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {TECHNOLOGY.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="deck-label">Rendimiento</p>
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {PERFORMANCE.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
