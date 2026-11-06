import { useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { useLab } from "./LabContext";
import { NAV_ITEMS, PROCEDURES, procedureLabel } from "./navigation";
import { useActiveSection, parseLocation } from "./useActiveSection";
import { Overview } from "./sections/Overview";
import { Questionnaire } from "./sections/Questionnaire";
import { DatabaseSection } from "./sections/Database";
import { Frequencies } from "./sections/Frequencies";
import { Descriptive } from "./sections/Descriptive";
import { Tests } from "./sections/Tests";
import { Charts } from "./sections/Charts";
import { InterpretationSection } from "./sections/InterpretationSection";
import { IconButton, SelectField, ResetFiltersButton } from "./components";
import {
  ACADEMIC_YEARS,
  MAJORS,
  SEXES,
  type AcademicYear,
  type Major,
  type Sex,
} from "../data/types";
import "./lab.css";

// Todas las vistas quedan montadas: conservan su estado local y la impresión
// sigue sacando el informe completo. Las secciones con varios procedimientos
// reciben cuál deben mostrar.
const VIEWS: ReadonlyArray<readonly [string, (procedure: string | null) => ReactNode]> = [
  ["inicio", () => <Overview />],
  ["cuestionario", () => <Questionnaire />],
  ["base-datos", () => <DatabaseSection />],
  ["frecuencias", () => <Frequencies />],
  ["descriptiva", () => <Descriptive />],
  ["pruebas", (procedure) => <Tests procedure={procedure} />],
  ["graficos", (procedure) => <Charts procedure={procedure} />],
  ["interpretacion", () => <InterpretationSection />],
];

// Las flechas del teclado recorren las paradas reales: cada procedimiento es
// una parada, igual que cada sección.
const STOPS = NAV_ITEMS.flatMap((item) => {
  const procedures = PROCEDURES[item.id];
  return procedures && procedures.length > 0
    ? procedures.map((procedure) => `${item.id}/${procedure.id}`)
    : [item.id];
});

function stopIndex(section: string, procedure: string | null): number {
  const key = procedure ? `${section}/${procedure}` : section;
  const exact = STOPS.indexOf(key);
  if (exact >= 0) return exact;
  return Math.max(0, STOPS.findIndex((stop) => stop.startsWith(`${section}/`)));
}

// Los únicos controles de la muestra viven aquí: todo el laboratorio (tabla,
// análisis y gráficos) refleja lo que se filtra en esta barra.
function SampleBar({ placement }: { placement: "side" | "top" }) {
  const { sample, filteredRows, filters, activeFilterCount, setFilter, resetFilters } = useLab();
  return (
    <div className={`lab-sample-bar lab-sample-bar--${placement}`}>
      <p className="lab-sample-readout" aria-live="polite">
        <span className="lab-sample-readout-label">Muestra</span>
        <span className="lab-sample-readout-value">
          n = {filteredRows.length}/{sample.n}
        </span>
      </p>
      <div className="lab-sample-controls">
        <SelectField
          label="Carrera"
          value={filters.major}
          onChange={(value) => setFilter("major", value as Major | "all")}
          options={[
            { value: "all", label: "Todas las carreras" },
            ...MAJORS.map((major) => ({ value: major, label: major })),
          ]}
        />
        <SelectField
          label="Sexo"
          value={filters.sex}
          onChange={(value) => setFilter("sex", value as Sex | "all")}
          options={[
            { value: "all", label: "Todos" },
            ...SEXES.map((sex) => ({ value: sex, label: sex })),
          ]}
        />
        <SelectField
          label="Año académico"
          value={String(filters.year)}
          onChange={(value) =>
            setFilter("year", value === "all" ? "all" : (Number(value) as AcademicYear))
          }
          options={[
            { value: "all", label: "Todos los años" },
            ...ACADEMIC_YEARS.map((year) => ({ value: String(year), label: `${year}.º año` })),
          ]}
        />
      </div>
      {activeFilterCount > 0 ? <ResetFiltersButton onClick={resetFilters} /> : null}
    </div>
  );
}

export function Lab() {
  const { sample, filteredRows, exportCsv } = useLab();
  const { section, procedure } = useActiveSection();

  const found = NAV_ITEMS.findIndex((item) => item.id === section);
  const sectionIndex = found === -1 ? 0 : found;
  const station = NAV_ITEMS[sectionIndex] ?? NAV_ITEMS[0]!;
  const stationName = procedure
    ? `${station.label} · ${procedureLabel(section, procedure)}`
    : station.label;
  const goToStation = (step: -1 | 1) => {
    const next = NAV_ITEMS[sectionIndex + step];
    if (next) window.location.hash = `#${next.id}`;
  };

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [section]);

  // Los navegadores no imprimen el contenido de un <details> cerrado. Al
  // imprimir se abren las tablas de respaldo y se restauran al terminar.
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const openAll = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>(".lab-details:not([open])"));
      opened.forEach((node) => {
        node.open = true;
      });
    };
    const restore = () => {
      opened.forEach((node) => {
        node.open = false;
      });
      opened = [];
    };
    window.addEventListener("beforeprint", openAll);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", openAll);
      window.removeEventListener("afterprint", restore);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (step === 0) return;
      // Se lee el hash y no el estado: dos pulsaciones seguidas no repiten parada.
      const here = parseLocation(window.location.hash);
      const next = STOPS[stopIndex(here.section, here.procedure) + step];
      if (!next) return;
      event.preventDefault();
      window.location.hash = `#${next}`;
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="lab-app">
      <a className="lab-skip-link" href="#inicio">
        Saltar al contenido
      </a>

      <aside className="lab-sidebar">
        <div className="lab-brand">
          <span className="lab-brand-mark" aria-hidden="true">
            Σ
          </span>
          <div>
            <p className="lab-brand-title">Estadística Uno</p>
            <p className="lab-brand-meta">UNAN-León · 2026</p>
          </div>
        </div>

        <nav className="lab-nav" aria-label="Estaciones del laboratorio">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="lab-nav-link"
                data-active={section === item.id}
                aria-current={section === item.id ? "page" : undefined}
              >
                <span className="lab-nav-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon aria-hidden="true" size={14} strokeWidth={1.8} className="lab-nav-icon" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="lab-sidebar-footer">
          <SampleBar placement="side" />
          <strong>Laboratorio de estadística</strong>
          <p className="mt-1">Tecnología y rendimiento académico universitario.</p>
          <p className="mt-2 font-mono text-label uppercase tracking-[0.08em]">
            semilla {sample.seed} · sintética
          </p>
        </div>
      </aside>

      <div className="lab-main">
        <header className="lab-header">
          <div className="lab-station">
            <span className="lab-station-index">
              Estación {String(sectionIndex + 1).padStart(2, "0")}/
              {String(NAV_ITEMS.length).padStart(2, "0")}
            </span>
            <span className="lab-station-name">{stationName}</span>
            <span className="lab-station-nav">
              <IconButton
                icon={ChevronLeft}
                label="Estación anterior"
                onClick={() => goToStation(-1)}
                disabled={sectionIndex === 0}
              />
              <IconButton
                icon={ChevronRight}
                label="Estación siguiente"
                onClick={() => goToStation(1)}
                disabled={sectionIndex === NAV_ITEMS.length - 1}
              />
            </span>
          </div>
          <div className="lab-header-actions">
            <IconButton icon={Download} label="Descargar CSV" onClick={exportCsv} />
            <IconButton icon={Printer} label="Imprimir reporte" onClick={() => window.print()} />
          </div>
        </header>

        <SampleBar placement="top" />

        <main className="lab-content">
          {VIEWS.map(([id, view]) => (
            <div key={id} className="lab-view" data-active={section === id}>
              {view(procedure)}
            </div>
          ))}

          <footer className="lab-footer">
            <p>UNAN-León · Ingeniería en Sistemas · Estadística Introductoria · 2026</p>
            <p className="mt-1">Los resultados describen la muestra visible.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}