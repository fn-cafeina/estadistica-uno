import { RefreshCw } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { SampleTable } from "../visuals/SampleTable";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { SceneFrame } from "../SceneFrame";

export function SampleScene(_: { onNext: () => void }) {
  const { sample, regenerate } = useSample();

  return (
    <SceneFrame
      kicker="03 / LA MUESTRA"
      title={<>{sample.n} estudiantes que <em>no existen</em>.</>}
      insight="Datos sintéticos para practicar. La semilla permite reproducir la muestra y todo lo que sigue se recalcula."
      footer={
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="deck-control deck-control-primary"
            onClick={regenerate}
          >
            <RefreshCw aria-hidden="true" size={15} />
            Otra muestra
          </button>
          <span className="text-[0.7rem] text-faint">
            Semilla <span className="font-mono text-muted">{sample.seed}</span>
          </span>
        </div>
      }
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="deck-label">Registros visibles</p>
          <AnimatedNumber
            value={sample.n}
            digits={0}
            className="deck-stat mt-2 block text-accent"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            No son personas reales. Son 13 variables generadas con ruido para que la estadística
            tenga algo que contar.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="deck-chip">13 variables</span>
            <span className="deck-chip">Muestra fija</span>
            <span className="deck-chip">CSV disponible</span>
          </div>
        </div>

        <div className="deck-panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="deck-fig">Fig. 2 · Primeras filas</p>
            <span className="font-mono text-[0.62rem] text-faint">n = {sample.n}</span>
          </div>
          <SampleTable rows={sample.rows} seed={sample.seed} />
          <p className="mt-3 border-t border-border pt-3 text-[0.66rem] leading-relaxed text-faint">
            Datos sintéticos con fines educativos. Al generar otra muestra, esta tabla y todas las
            escenas cambian.
          </p>
        </div>
      </div>
    </SceneFrame>
  );
}
