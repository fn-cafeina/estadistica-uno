import { useEffect, type ReactNode } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
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
import { IconButton, ViewNav } from "./components";
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

export function Lab() {
  const { sample, filteredRows, regenerate, exportCsv } = useLab();
  const { section, procedure } = useActiveSection();
  const activeIndex = Math.max(0, NAV_ITEMS.findIndex((item) => item.id === section));
  const activeItem = NAV_ITEMS[activeIndex];
  const procedureTitle = procedureLabel(section, procedure);

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

  const progress = `${String(activeIndex + 1).padStart(2, "0")} / ${String(NAV_ITEMS.length).padStart(2, "0")}`;

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

        <nav className="lab-nav" aria-label="Secciones del laboratorio">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="lab-nav-link"
                data-active={section === item.id}
                aria-current={section === item.id ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={14} strokeWidth={1.8} className="lab-nav-icon" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="lab-sidebar-footer">
          <strong>Laboratorio de estadística</strong>
          <p className="mt-1">Tecnología y rendimiento académico universitario.</p>
          <p className="mt-2 font-mono text-label uppercase tracking-[0.08em]">
            {filteredRows.length} de {sample.n} registros · semilla {sample.seed}
          </p>
        </div>
      </aside>

      <div className="lab-main">
        <header className="lab-header">
          <div className="lab-header-title">
            <p>
              Laboratorio de estadística · {progress}
            </p>
            <strong>
              {activeItem?.label ?? "Inicio"}
              {procedureTitle ? <span className="lab-header-sub"> · {procedureTitle}</span> : null}
            </strong>
          </div>
          <div className="lab-header-actions">
            <button type="button" className="lab-button lab-button-primary" onClick={regenerate}>
              <RefreshCw aria-hidden="true" size={13} />
              <span className="hidden sm:inline">Nueva muestra</span>
              <span className="sm:hidden">Nueva</span>
            </button>
            <IconButton icon={Download} label="Descargar CSV" onClick={exportCsv} />
            <IconButton icon={Printer} label="Imprimir reporte" onClick={() => window.print()} />
          </div>
        </header>

        <main className="lab-content">
          {VIEWS.map(([id, view]) => (
            <div key={id} className="lab-view" data-active={section === id}>
              {view(procedure)}
            </div>
          ))}

          <ViewNav active={section} />

          <footer className="lab-footer">
            <p>UNAN-León · Ingeniería en Sistemas · Estadística Introductoria · 2026</p>
            <p className="mt-1">Los resultados describen la muestra visible.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}