import { ClipboardList, Info } from "lucide-react";
import { QUESTIONNAIRE, PERFORMANCE_VARIABLE } from "../data/schema";
import { formatDate } from "../lib/format";
import { useApp } from "../state/AppContext";
import { Badge, Callout, Card, KeyValue, SectionHeader } from "../components/ui";

const TYPE_LABELS = {
  nominal: "Cualitativa nominal",
  ordinal: "Cualitativa ordinal",
  discrete: "Cuantitativa discreta",
  continuous: "Cuantitativa continua",
} as const;

export function Questionnaire() {
  const { state } = useApp();

  return (
    <section id="cuestionario" className="border-t border-border/70 py-10 sm:py-14">
      <SectionHeader
        number="02"
        icon={ClipboardList}
        title="Cuestionario y variables"
        description="El instrumento que da origen a la base. Cada pregunta tiene una variable, un tipo de medición y una forma de codificación."
        aside={<Badge tone="accent">{QUESTIONNAIRE.length} preguntas</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <ol className="divide-y divide-border">
            {QUESTIONNAIRE.map((variable) => (
              <li key={variable.key} className="p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-[0.7rem] font-bold text-muted">
                    {String(variable.number).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-fg">
                      {variable.question}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          variable.type === "nominal" || variable.type === "ordinal"
                            ? "purple"
                            : "accent"
                        }
                      >
                        {TYPE_LABELS[variable.type]}
                      </Badge>
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.68rem] text-muted">
                        {variable.key}
                      </code>
                      {variable.unit ? (
                        <span className="text-[0.68rem] text-faint">Unidad: {variable.unit}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{variable.coding}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info aria-hidden="true" size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-fg">Ficha de la muestra</h3>
            </div>
            <dl className="mt-3">
              <KeyValue label="Registros" value={state.sample.n} />
              <KeyValue label="Semilla" value={<code className="text-xs">{state.sample.seed}</code>} />
              <KeyValue label="Generada" value={formatDate(state.sample.generatedAt)} />
              <KeyValue label="Tipo" value="Sintética, educativa" />
            </dl>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              La semilla permite reproducir la muestra. Al generar una nueva, cambia junto con los
              datos.
            </p>
          </Card>

          <Callout tone="info" title="Instrumento de referencia" icon={Info}>
            La base ya viene cargada. Las preguntas no se responden en la aplicación: sirven para
            entender qué se midió y cómo se codificó cada variable.
          </Callout>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-fg">Variable derivada</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Para la prueba chi-cuadrado se usa <code className="text-fg">performanceLevel</code>,
              calculada desde el promedio:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PERFORMANCE_VARIABLE.categories.map((category) => (
                <Badge key={category} tone="neutral">
                  {category}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              Bajo: menos de 70 puntos. Medio: 70 a 79.9. Alto: 80 o más. Es una categorización
              didáctica, no una escala oficial de la universidad.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
