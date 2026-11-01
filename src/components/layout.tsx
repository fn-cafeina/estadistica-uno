import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronRight,
  Database,
  Download,
  GraduationCap,
  HelpCircle,
  Info,
  Menu,
  Palette,
  Printer,
  RefreshCw,
  Sigma,
  X,
  BarChart3,
} from "lucide-react";
import { NAV_ITEMS } from "./layout/navigation";
import { useActiveSection } from "../lib/scrollSpy";
import { getThemeOption, THEME_OPTIONS } from "../lib/theme";
import { useApp } from "../state/AppContext";
import { Badge, Button, IconButton, cn } from "./ui";
import type { ThemeId } from "../data/types";

const NAV_IDS = NAV_ITEMS.map((item) => item.id);

export function Sidebar({ activeId }: { activeId: string }) {
  return (
    <aside className="sidebar hidden border-r border-border bg-surface/60 lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
      <a href="#inicio" className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
          <Sigma aria-hidden="true" size={21} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-sm font-semibold tracking-tight text-fg">Estadística Uno</span>
          <span className="block text-[0.68rem] leading-snug text-muted">Laboratorio de datos</span>
        </span>
      </a>

      <nav aria-label="Secciones" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="nav-link"
              aria-current={activeId === item.id ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.9} className="shrink-0" />
              <span className="truncate">{item.label}</span>
              {activeId === item.id ? (
                <ChevronRight aria-hidden="true" size={13} className="ml-auto shrink-0 text-accent" />
              ) : null}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Badge tone="accent" icon={Info}>
          Datos sintéticos
        </Badge>
        <p className="mt-3 text-[0.7rem] leading-relaxed text-muted">
          UNAN-León · Ingeniería en Sistemas
          <br />
          Estadística Introductoria · 2026
        </p>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-faint">
          Muestra educativa. No corresponde a estudiantes reales.
        </p>
      </div>
    </aside>
  );
}

function ThemeMenu() {
  const { state, setTheme } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getThemeOption(state.theme);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (theme: ThemeId) => {
    setTheme(theme);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        icon={Palette}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Tema actual: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="hidden xl:inline">{current.name}</span>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="menu"
            aria-label="Elegir tema"
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-1.5 shadow-2xl"
          >
            {THEME_OPTIONS.map((option) => {
              const selected = option.id === state.theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => choose(option.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-surface-3" : "hover:bg-surface-2",
                  )}
                >
                  <span className="mt-0.5 flex gap-1" aria-hidden="true">
                    {option.swatches.map((color) => (
                      <span
                        key={color}
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-fg">{option.name}</span>
                    <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted">
                      {option.description}
                    </span>
                  </span>
                  {selected ? <Check aria-hidden="true" size={15} className="mt-1 text-accent" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Header({ activeId, onOpenMenu }: { activeId: string; onOpenMenu: () => void }) {
  const { regenerate, exportCsv, printReport, openHelp } = useApp();
  const active = NAV_ITEMS.find((item) => item.id === activeId) ?? NAV_ITEMS[0];

  return (
    <header className="app-header no-print sticky top-0 z-40 border-b border-border">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <IconButton
          icon={Menu}
          label="Abrir menú de secciones"
          className="lg:hidden"
          onClick={onOpenMenu}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-faint">
            Laboratorio de estadística
          </p>
          <p className="truncate text-sm font-semibold text-fg">{active?.label}</p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={() => regenerate()}
            className="hidden sm:inline-flex"
          >
            Nueva muestra
          </Button>
          <IconButton icon={Download} label="Descargar CSV" onClick={exportCsv} />
          <IconButton icon={Printer} label="Imprimir reporte" onClick={printReport} />
          <ThemeMenu />
          <IconButton icon={HelpCircle} label="Cómo leer la aplicación" onClick={openHelp} />
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state, regenerate, exportCsv, printReport, openHelp } = useApp();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="mobile-nav-dialog no-print"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      aria-label="Menú de secciones"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
              <Sigma aria-hidden="true" size={17} />
            </span>
            <span className="font-display text-sm font-semibold text-fg">Estadística Uno</span>
          </div>
          <IconButton icon={X} label="Cerrar menú" onClick={onClose} />
        </div>
        <nav aria-label="Secciones" className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.id} href={`#${item.id}`} className="nav-link" onClick={onClose}>
                <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <Button variant="primary" icon={RefreshCw} className="w-full" onClick={() => regenerate()}>
            Nueva muestra ({state.sampleSize})
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button icon={Download} onClick={exportCsv}>
              CSV
            </Button>
            <Button icon={Printer} onClick={printReport}>
              Imprimir
            </Button>
          </div>
          <Button
            variant="ghost"
            icon={HelpCircle}
            className="w-full"
            onClick={() => {
              onClose();
              openHelp();
            }}
          >
            Cómo leer la app
          </Button>
        </div>
      </div>
    </dialog>
  );
}

const GUIDE_STEPS = [
  {
    icon: Info,
    title: "La muestra es sintética",
    text: "Los 80 registros iniciales se generaron con una semilla reproducible. No son estudiantes reales y no sirven para generalizar a una población.",
  },
  {
    icon: Database,
    title: "Explora la base",
    text: "La tabla permite ordenar, buscar y filtrar. Los filtros de la base afectan todos los análisis, no solo la tabla.",
  },
  {
    icon: BarChart3,
    title: "Los resultados se recalculan",
    text: "Cada tabla, prueba y gráfico sale de las filas visibles. Al generar una nueva muestra o cambiar un filtro, todo se actualiza.",
  },
  {
    icon: GraduationCap,
    title: "Interpreta con cautela",
    text: "Una asociación no demuestra causalidad. Revisa siempre el tamaño de la muestra, los supuestos y las limitaciones del diseño.",
  },
] as const;

const GLOSSARY = [
  ["Población y muestra", "La población es el conjunto completo que interesa; la muestra es el subconjunto que se observa. Aquí la muestra es sintética."],
  ["Variable cualitativa", "Describe una categoría o atributo, como la carrera o el dispositivo principal. No se mide con números."],
  ["Variable cuantitativa", "Se mide numéricamente, como las horas de pantalla o el promedio. Permite calcular medias y desviaciones."],
  ["Frecuencia absoluta", "Número de casos que caen en una categoría o intervalo."],
  ["Frecuencia relativa", "Proporción de casos en una categoría: frecuencia absoluta dividida entre el total."],
  ["Media", "Promedio aritmético. Resume el centro, pero es sensible a valores extremos."],
  ["Mediana", "Valor que deja la mitad de los datos por debajo y la mitad por encima. Es más robusta ante valores extremos."],
  ["Moda", "Valor o categoría que más se repite. Puede no existir una moda única."],
  ["Desviación estándar", "Distancia típica de los datos respecto a la media, en las mismas unidades de la variable."],
  ["Cuartil", "Valor que divide los datos ordenados en cuatro partes. Q1 deja 25% debajo; Q3, 75%."],
  ["Chi-cuadrado", "Prueba que compara frecuencias observadas con las esperadas si dos variables cualitativas fueran independientes."],
  ["Valor p", "Probabilidad de observar un resultado al menos tan extremo como el obtenido si la hipótesis nula fuera cierta. No es la probabilidad de que H₀ sea verdadera."],
  ["Correlación de Pearson", "Mide la fuerza y dirección de una relación lineal entre dos variables cuantitativas. Va de -1 a 1."],
  ["R²", "Proporción de la variabilidad de Y que explica el modelo lineal. En regresión simple coincide con r²."],
  ["Regresión lineal", "Recta que resume cómo cambia Y, en promedio, cuando X cambia en una unidad. No prueba causalidad."],
  ["Causalidad", "Relación en la que un cambio en una variable produce un cambio en otra. La correlación por sí sola no la demuestra."],
] as const;

export function HelpDialog() {
  const { state, closeHelp } = useApp();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"guide" | "glossary">("guide");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state.helpOpen && !dialog.open) dialog.showModal();
    if (!state.helpOpen && dialog.open) dialog.close();
  }, [state.helpOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="help-dialog no-print"
      onClose={closeHelp}
      onClick={(event) => {
        if (event.target === dialogRef.current) closeHelp();
      }}
      aria-labelledby="help-title"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <div className="eyebrow">
              <HelpCircle aria-hidden="true" size={14} />
              Ayuda
            </div>
            <h2 id="help-title" className="mt-1 text-xl font-semibold text-fg">
              Cómo leer esta aplicación
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Una guía breve para recorrer los datos sin perderse en la notación.
            </p>
          </div>
          <IconButton icon={X} label="Cerrar ayuda" onClick={closeHelp} />
        </div>

        <div className="flex gap-1 border-b border-border px-5 pt-3" role="tablist" aria-label="Contenido de ayuda">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "guide"}
            onClick={() => setTab("guide")}
            className={cn(
              "border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
              tab === "guide" ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            Guía rápida
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "glossary"}
            onClick={() => setTab("glossary")}
            className={cn(
              "border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
              tab === "glossary" ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            Glosario
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {tab === "guide" ? (
            <ol className="space-y-4">
              {GUIDE_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent">
                      <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <dl className="space-y-3">
              {GLOSSARY.map(([term, definition]) => (
                <div key={term} className="rounded-lg border border-border bg-surface-2 p-3">
                  <dt className="text-xs font-semibold text-fg">{term}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-muted">{definition}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button variant="primary" className="w-full" onClick={closeHelp}>
            Entendido
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export function Toast() {
  const { state } = useApp();
  const reduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {state.toast ? (
          <motion.div
            key={state.toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="toast rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-medium text-fg shadow-xl"
            role="status"
          >
            {state.toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = useActiveSection(NAV_IDS);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        Saltar al contenido
      </a>
      <Sidebar activeId={activeId} />
      <div className="min-w-0">
        <Header activeId={activeId} onOpenMenu={() => setMobileOpen(true)} />
        <main id="contenido" className="app-main mx-auto max-w-[1180px] px-4 pb-20 pt-2 sm:px-6 lg:px-10">
          {children}
        </main>
        <footer className="no-print border-t border-border px-4 py-8 text-center sm:px-6">
          <p className="text-xs font-medium text-muted">
            Uso de la tecnología y rendimiento académico universitario
          </p>
          <p className="mt-1 text-[0.68rem] text-faint">
            UNAN-León · Ingeniería en Sistemas · Estadística Introductoria · 2026
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[0.68rem] leading-relaxed text-faint">
            Datos sintéticos con fines educativos. No representan estudiantes reales. Los resultados
            describen únicamente esta muestra y no deben generalizarse sin un diseño de muestreo adecuado.
          </p>
        </footer>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <HelpDialog />
      <Toast />
    </div>
  );
}
