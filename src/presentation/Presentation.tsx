import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sigma,
  StickyNote,
  X,
} from "lucide-react";
import { useSample } from "../state/SampleContext";
import { SCENE_NOTES } from "./notes";
import { useDeck } from "./useDeck";
import "./deck.css";

function PlaceholderScene({ index }: { index: number }) {
  const { sample } = useSample();
  const note = SCENE_NOTES[index];

  return (
    <div className="deck-scene">
      <p className="deck-kicker">
        <span>0{index + 1}</span>
        <span aria-hidden="true">/</span>
        <span>{note?.title ?? "Escena"}</span>
      </p>
      <h1 className="deck-title deck-title-xl">La presentación se está armando</h1>
      <p className="deck-insight">
        {sample.n} registros sintéticos. Semilla {sample.seed}. Esta escena se reemplaza en el
        siguiente commit.
      </p>
    </div>
  );
}

export function Presentation() {
  const { sample, sampleSize, regenerate } = useSample();
  const reduced = useReducedMotion();
  const sceneCount = SCENE_NOTES.length;
  const { index, direction, goTo, next, prev } = useDeck(sceneCount);
  const [notesOpen, setNotesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const currentNote = SCENE_NOTES[index];

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void document.documentElement.requestFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("input, select, textarea, button, a, [contenteditable]");

      if (event.key === "Escape") {
        if (notesOpen) {
          setNotesOpen(false);
          event.preventDefault();
        }
        return;
      }

      if (interactive) return;

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          prev();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(sceneCount - 1);
          break;
        case "n":
        case "N":
          event.preventDefault();
          setNotesOpen((open) => !open);
          break;
        case "f":
        case "F":
          event.preventDefault();
          toggleFullscreen();
          break;
        case "r":
        case "R":
          event.preventDefault();
          regenerate();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, next, notesOpen, prev, regenerate, sceneCount, toggleFullscreen]);

  const variants = reduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (move: number) => ({ opacity: 0, x: move > 0 ? 64 : -64, filter: "blur(6px)" }),
        center: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (move: number) => ({ opacity: 0, x: move > 0 ? -64 : 64, filter: "blur(6px)" }),
      };

  return (
    <div
      className="deck-stage"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("input, button, a, select, textarea")) return;
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      <div aria-hidden="true" className="deck-orb deck-orb-a" />
      <div aria-hidden="true" className="deck-orb deck-orb-b" />

      <header className="deck-topbar">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
            <Sigma aria-hidden="true" size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-tight text-fg">Estadística Uno</p>
            <p className="truncate text-[0.62rem] text-faint">Tecnología y rendimiento</p>
          </div>
        </div>

        <nav aria-label="Progreso de la presentación" className="deck-progress">
          {Array.from({ length: sceneCount }, (_, sceneIndex) => (
            <button
              key={sceneIndex}
              type="button"
              className="deck-progress-segment"
              data-active={sceneIndex === index}
              data-done={sceneIndex < index}
              aria-label={`Ir a la escena ${sceneIndex + 1}: ${SCENE_NOTES[sceneIndex]?.title ?? ""}`}
              aria-current={sceneIndex === index ? "step" : undefined}
              onClick={() => goTo(sceneIndex)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="deck-icon-button"
            title="Nueva muestra (R)"
            aria-label="Generar nueva muestra"
            onClick={() => regenerate(sampleSize)}
          >
            <RefreshCw aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            className="deck-icon-button"
            data-active={notesOpen}
            title="Notas del presentador (N)"
            aria-label="Mostrar notas del presentador"
            aria-expanded={notesOpen}
            onClick={() => setNotesOpen((open) => !open)}
          >
            <StickyNote aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            className="deck-icon-button"
            title="Pantalla completa (F)"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Entrar a pantalla completa"}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 aria-hidden="true" size={16} />
            ) : (
              <Maximize2 aria-hidden="true" size={16} />
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1"
          >
            <PlaceholderScene index={index} />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="deck-bottombar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="deck-icon-button"
            aria-label="Escena anterior"
            disabled={index === 0}
            onClick={prev}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <span className="min-w-16 text-center text-xs tabular-nums text-muted">
            {String(index + 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="deck-icon-button"
            aria-label="Escena siguiente"
            disabled={index === sceneCount - 1}
            onClick={next}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>

        <p className="deck-swipe-hint ml-auto hidden sm:block">
          Flechas para navegar · N notas · F pantalla completa
        </p>
        <p className="ml-auto text-[0.65rem] tabular-nums text-faint sm:hidden">
          Semilla {sample.seed}
        </p>
      </footer>

      <span className="sr-only" aria-live="polite">
        Escena {index + 1} de {sceneCount}: {currentNote?.title}
      </span>

      <AnimatePresence>
        {notesOpen ? (
          <motion.aside
            className="deck-notes"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            aria-label="Notas del presentador"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="deck-kicker">Guion</p>
                <h2 className="mt-2 font-display text-xl text-fg">{currentNote?.title}</h2>
              </div>
              <button
                type="button"
                className="deck-icon-button"
                aria-label="Cerrar notas"
                onClick={() => setNotesOpen(false)}
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {currentNote?.notes.map((note) => (
                <p key={note} className="deck-note-line">
                  {note}
                </p>
              ))}
            </div>
            <p className="mt-6 text-[0.66rem] leading-relaxed text-faint">
              Las notas solo las ves vos. La audiencia ve la escena.
            </p>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
