import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSample } from "../../state/SampleContext";
import { getCategories, getCategoricalValue } from "../../data/schema";
import { chiSquareTest } from "../../stats/chiSquare";
import { formatPValue, pDecisionText } from "../../lib/format";
import { ContingencyGrid } from "../visuals/ContingencyGrid";
import { AnimatedNumber } from "../visuals/AnimatedNumber";
import { cn, SceneFrame, type SceneProps } from "../SceneFrame";

const ALPHA = 0.05;

export function IndependenceScene(_: SceneProps) {
  const { sample } = useSample();
  const [showExpected, setShowExpected] = useState(false);

  const result = useMemo(() => {
    const pairs = sample.rows.map((row) => ({
      row: getCategoricalValue(row, "studyTechFrequency"),
      col: getCategoricalValue(row, "performanceLevel"),
    }));
    return chiSquareTest(
      pairs,
      getCategories("studyTechFrequency"),
      getCategories("performanceLevel"),
      ALPHA,
    );
  }, [sample]);

  if (!result) {
    return (
      <SceneFrame kicker="08 / LA PRUEBA" title="La prueba no se pudo calcular.">
        <p className="deck-insight">Faltan categorías o datos suficientes.</p>
      </SceneFrame>
    );
  }

  const weakExpected = result.cellsBelow5 > 0;

  return (
    <SceneFrame
      kicker="08 / LA PRUEBA"
      title={<>¿Uso y rendimiento <em>van juntos</em>?</>}
      insight="La tabla muestra lo observado. El botón cambia a lo que veríamos si no hubiera relación."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex border border-border-strong">
            <button
              type="button"
              className={cn(
                "px-3 py-1.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors",
                !showExpected ? "bg-accent text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
              onClick={() => setShowExpected(false)}
            >
              Observado
            </button>
            <button
              type="button"
              className={cn(
                "border-l border-border-strong px-3 py-1.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors",
                showExpected ? "bg-accent text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
              onClick={() => setShowExpected(true)}
            >
              Esperado
            </button>
          </div>
          <span className="deck-fig">
            {showExpected ? "Esperado = si no hubiera relación" : "Conteos reales de la muestra"}
          </span>
        </div>
      }
    >
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="deck-label">Valor p</p>
          <p className="deck-stat mt-2 text-accent">{formatPValue(result.pValue)}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            χ² = <AnimatedNumber value={result.statistic} digits={2} /> · gl ={" "}
            {result.degreesOfFreedom} · Cramér's V ={" "}
            <AnimatedNumber value={result.cramersV} digits={2} />.
          </p>

          <div
            className={cn(
              "deck-slab mt-6",
              result.rejectNull ? "border-success/60" : "border-warning/60",
            )}
          >
            <p className="deck-label">Decisión con α = 0.05</p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-fg">
              {result.rejectNull ? (
                <CheckCircle2 aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-success" />
              ) : (
                <AlertTriangle aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-warning" />
              )}
              <span>{pDecisionText(result.pValue, ALPHA)}</span>
            </p>
          </div>

          {weakExpected ? (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-warning">
              <AlertTriangle aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
              {result.cellsBelow5} de {result.totalCells} celdas tienen esperado menor que 5. La
              aproximación chi-cuadrado puede ser inestable.
            </p>
          ) : (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-success">
              <CheckCircle2 aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
              Todas las frecuencias esperadas son al menos 5.
            </p>
          )}
        </div>

        <div className="deck-panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="deck-fig">Fig. 7 · Uso para estudiar por nivel de rendimiento</p>
            <span className="font-mono text-[0.62rem] text-faint">n = {result.total}</span>
          </div>
          <ContingencyGrid result={result} showExpected={showExpected} />
          <p className="mt-3 border-t border-border pt-3 text-[0.66rem] leading-relaxed text-faint">
            Nivel de rendimiento: categorización didáctica del promedio.
          </p>
        </div>
      </div>
    </SceneFrame>
  );
}
