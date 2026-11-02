import { ArrowRight, Home } from "lucide-react";
import { useLab } from "../LabContext";
import { mean } from "../../stats/descriptive";
import { pearsonCorrelation } from "../../stats/correlation";
import { formatNumber } from "../../lib/format";
import { GROUP_MEMBERS } from "../navigation";
import { Section, Metric, Panel, Badge, Callout } from "../components";

export function Overview() {
  const { sample, filteredRows } = useLab();
  const gpa = mean(filteredRows.map((row) => row.gpa));
  const screen = mean(filteredRows.map((row) => row.screenHours));
  const correlation = pearsonCorrelation(
    filteredRows.map((row) => row.studyHours),
    filteredRows.map((row) => row.gpa),
  );

  return (
    <Section
      id="inicio"
      number="00 / INICIO"
      icon={Home}
      title={
        <>
          Tecnología y rendimiento <em>académico</em> universitario.
        </>
      }
      description="Un laboratorio para describir una muestra, comparar grupos, medir asociaciones y entender qué dicen los números. Todos los resultados se calculan desde los datos visibles."
      aside={<Badge tone="accent">Datos sintéticos</Badge>}
    >
      <div className="lab-grid lab-grid-sidebar">
        <div>
          <p className="lab-label">Objetivo</p>
          <p className="mt-3 max-w-[30ch] font-display text-2xl leading-tight text-fg sm:text-3xl">
            Analizar la relación entre el uso de la tecnología y el rendimiento académico en una
            muestra de estudiantes universitarios.
          </p>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-muted">
            La aplicación reúne el cuestionario, la base sintética, las tablas de frecuencia, los
            resúmenes descriptivos, las pruebas de asociación y los gráficos. No es una presentación:
            es un laboratorio para explorar y estudiar los procedimientos.
          </p>
          <div className="mt-5">
            <Badge tone="warning">Muestra fija de 80 · semilla {sample.seed}</Badge>
          </div>
        </div>

        <Panel title="Equipo" meta="UNAN-León · 2026">
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {GROUP_MEMBERS.map((name, index) => (
              <li key={name} className="border-t border-border pt-2">
                <span className="font-mono text-label text-accent">0{index + 1}</span>
                <span className="mt-1 block font-display text-lg leading-tight text-fg">{name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 font-mono text-label uppercase tracking-[0.1em] text-faint">
            Estadística Introductoria · Ingeniería en Sistemas
          </p>
        </Panel>
      </div>

      <div className="lab-metrics mt-5">
        <Metric
          label="Registros visibles"
          value={filteredRows.length}
          hint={`De ${sample.n} en la muestra`}
          accent
        />
        <Metric
          label="Promedio medio"
          value={formatNumber(gpa, 1)}
          hint="Puntos sobre 100"
        />
        <Metric
          label="Pantalla al día"
          value={`${formatNumber(screen, 1)} h`}
          hint="Promedio de la muestra"
        />
        <Metric
          label="Correlación estudio-promedio"
          value={correlation ? formatNumber(correlation.r, 2) : "s/d"}
          hint={correlation ? `${correlation.strength}, ${correlation.direction}` : "No calculable"}
        />
      </div>

      <div className="mt-5">
        <Callout title="Datos sintéticos con fines educativos">
          La base no proviene de estudiantes reales. Se genera con una semilla reproducible para
          practicar los procedimientos. Los resultados describen esta muestra y no deben generalizarse
          a la población universitaria.
        </Callout>
      </div>

      <div className="mt-5">
        <a className="lab-button lab-button-primary" href="#base-datos">
          Empezar por la base de datos
          <ArrowRight aria-hidden="true" size={13} />
        </a>
      </div>
    </Section>
  );
}
