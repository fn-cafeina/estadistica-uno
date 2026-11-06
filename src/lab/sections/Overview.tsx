import { useLab } from "../LabContext";
import { VARIABLES, QUESTIONNAIRE } from "../../data/schema";
import { formatDate } from "../../lib/format";
import { GROUP_MEMBERS } from "../navigation";
import { Section, Panel, Callout } from "../components";

export function Overview() {
  const { sample, filteredRows } = useLab();

  return (
    <Section
      id="inicio"
      title={
        <>
          Tecnología y rendimiento <em>académico</em> universitario.
        </>
      }
      description="Un laboratorio para describir una muestra, comparar grupos, medir asociaciones y entender qué dicen los números."
    >
      <div className="lab-grid lab-grid-sidebar">
        <Panel title="Ficha de la muestra" meta="Estación 01">
          <p className="max-w-[58ch] text-sm leading-relaxed text-muted">
            Analizar la relación entre el uso de la tecnología y el rendimiento académico en una
            muestra de estudiantes universitarios.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="lab-chip">n = {filteredRows.length}/{sample.n}</span>
            <span className="lab-chip">{VARIABLES.length} variables</span>
            <span className="lab-chip">{QUESTIONNAIRE.length} preguntas</span>
            <span className="lab-chip">semilla {sample.seed}</span>
            <span className="lab-chip">generada {formatDate(sample.generatedAt)}</span>
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-faint">
            La muestra es fija: se genera una sola vez con esta semilla y no se regenera, para que
            la web, la impresión y los documentos siempre muestren los mismos datos.
          </p>
        </Panel>

        <Callout title="Datos sintéticos con fines educativos">
          La base no proviene de estudiantes reales: sirve para practicar los procedimientos. Los
          resultados describen esta muestra y no deben generalizarse a la población universitaria.
          <p className="mt-3 border-t border-border pt-3">
            <span className="font-mono text-label uppercase tracking-[0.08em] text-faint">
              Equipo
            </span>
            <ul className="mt-1 space-y-1">
              {GROUP_MEMBERS.map((name) => (
                <li key={name} className="text-sm text-fg">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-label uppercase tracking-[0.08em] text-faint">
              Estadística Introductoria · Ingeniería en Sistemas
            </p>
          </p>
        </Callout>
      </div>
    </Section>
  );
}
