import { AppProvider, useApp } from "./state/AppContext";
import { AppShell } from "./components/layout";
import { Hero } from "./sections/Hero";
import { Questionnaire } from "./sections/Questionnaire";
import { Database } from "./sections/Database";
import { Frequencies } from "./sections/Frequencies";
import { Descriptive } from "./sections/Descriptive";
import { Inference } from "./sections/Inference";
import { ChartsSection } from "./sections/ChartsSection";
import { Interpretation } from "./sections/Interpretation";
import { formatDate } from "./lib/format";

function PrintHeader() {
  const { state, filteredRows } = useApp();
  return (
    <div className="print-only mb-5 border-b border-border pb-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
        UNAN-León · Ingeniería en Sistemas · Estadística Introductoria · 2026
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-fg">
        Uso de la tecnología y rendimiento académico universitario
      </h1>
      <p className="mt-1 text-xs text-muted">
        Reporte de datos sintéticos con fines educativos · Muestra n = {filteredRows.length} de{" "}
        {state.sample.n} · Semilla {state.sample.seed} · Generada {formatDate(state.sample.generatedAt)}
      </p>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppShell>
        <PrintHeader />
        <Hero />
        <Questionnaire />
        <Database />
        <Frequencies />
        <Descriptive />
        <Inference />
        <ChartsSection />
        <Interpretation />
      </AppShell>
    </AppProvider>
  );
}
