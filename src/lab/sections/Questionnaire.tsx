import { QUESTIONNAIRE, PERFORMANCE_VARIABLE } from "../../data/schema";
import { TYPE_LABELS } from "../navigation";
import { Section, Panel, Badge, Callout, TableWrap } from "../components";

export function Questionnaire() {
  return (
    <Section
      id="cuestionario"
      title={<>El instrumento y sus <em>variables</em>.</>}
      description="Trece preguntas adaptadas al tema. Cada una tiene una variable, un tipo de medición y una codificación que permite construir la base."
    >
      <div className="lab-grid lab-grid-sidebar">
        <Panel title="Cuestionario de referencia" meta="Ya cargado en la base">
          <TableWrap>
            <table className="lab-table lab-table-questionnaire">
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
                    <td className="font-medium text-fg">{variable.question}</td>
                    <td>
                      <code className="font-mono text-label text-muted">{variable.key}</code>
                    </td>
                    <td className="whitespace-nowrap text-muted">{TYPE_LABELS[variable.type]}</td>
                    <td className="text-label leading-relaxed text-muted">
                      {variable.unit ? `${variable.unit}. ` : ""}
                      {variable.coding}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        {/* Es un detalle del instrumento, no el contenido principal: va como
            nota para que la tabla del cuestionario siga mandando en la
            distribución. */}
        <Callout title="Variable derivada para chi-cuadrado">
          <p>El nivel de rendimiento se calcula desde el promedio académico:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERFORMANCE_VARIABLE.categories.map((category) => (
              <Badge key={category}>{category}</Badge>
            ))}
          </div>
          <p className="mt-2">
            Bajo: menos de 70. Medio: 70 a 79.9. Alto: 80 o más. Es una categorización didáctica,
            no una escala oficial.
          </p>
        </Callout>
      </div>
    </Section>
  );
}
