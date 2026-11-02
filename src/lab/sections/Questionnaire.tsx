import { Info } from "lucide-react";
import { QUESTIONNAIRE, PERFORMANCE_VARIABLE } from "../../data/schema";
import { formatDate } from "../../lib/format";
import { useLab } from "../LabContext";
import { TYPE_LABELS } from "../navigation";
import { Section, Panel, Badge, Callout, KeyValue, TableWrap } from "../components";

export function Questionnaire() {
  const { sample } = useLab();

  return (
    <Section
      id="cuestionario"
      title={<>El instrumento y sus <em>variables</em>.</>}
      description="Trece preguntas adaptadas al tema. Cada una tiene una variable, un tipo de medición y una codificación que permite construir la base."
    >
      <div className="lab-grid lab-grid-sidebar">
        <Panel title="Cuestionario de referencia" meta="Ya cargado en la base">
          <TableWrap hint="Desliza para ver todas las columnas.">
            <table className="lab-table min-w-[48rem]">
              <caption className="sr-only">
                Preguntas del cuestionario, variable, tipo de medición y codificación.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-10">#</th>
                  <th scope="col">Pregunta</th>
                  <th scope="col">Variable</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Codificación</th>
                </tr>
              </thead>
              <tbody>
                {QUESTIONNAIRE.map((variable) => (
                  <tr key={variable.key}>
                    <td className="font-mono text-label text-faint">
                      {String(variable.number).padStart(2, "0")}
                    </td>
                    <td className="min-w-[18rem] font-medium text-fg">{variable.question}</td>
                    <td>
                      <code className="font-mono text-label text-muted">{variable.key}</code>
                    </td>
                    <td className="whitespace-nowrap text-muted">{TYPE_LABELS[variable.type]}</td>
                    <td className="min-w-[16rem] text-label leading-relaxed text-muted">
                      {variable.unit ? `${variable.unit}. ` : ""}
                      {variable.coding}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <div className="space-y-6">
          <Panel title="Ficha de la muestra" meta="Sintética">
            <dl>
              <KeyValue label="Registros" value={sample.n} />
              <KeyValue label="Semilla" value={<code className="text-xs">{sample.seed}</code>} />
              <KeyValue label="Generada" value={formatDate(sample.generatedAt)} />
              <KeyValue label="Origen" value="Datos sintéticos" />
            </dl>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              La semilla permite reproducir la muestra. Al generar una nueva, la tabla y todos los
              análisis cambian.
            </p>
          </Panel>

          <Callout title="Instrumento de referencia" icon={Info}>
            La base ya viene cargada. Las preguntas no se responden en la aplicación: sirven para
            entender qué se midió y cómo se codificó cada variable.
          </Callout>

          <Panel title="Variable derivada" meta="Para chi-cuadrado">
            <p className="text-xs leading-relaxed text-muted">
              El nivel de rendimiento se calcula desde el promedio académico:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PERFORMANCE_VARIABLE.categories.map((category) => (
                <Badge key={category}>{category}</Badge>
              ))}
            </div>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">
              Bajo: menos de 70. Medio: 70 a 79.9. Alto: 80 o más. Es una categorización didáctica,
              no una escala oficial.
            </p>
          </Panel>
        </div>
      </div>
    </Section>
  );
}
