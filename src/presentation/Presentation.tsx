import { useCallback, useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Maximize2,
  Minimize2,
  RefreshCw,
  StickyNote,
  X,
} from "lucide-react";
import { useSample } from "../state/SampleContext";
import { SCENE_NOTES } from "./notes";
import { useDeck } from "./useDeck";
import { TitleScene } from "./scenes/TitleScene";
import { GuessScene } from "./scenes/GuessScene";
import { SampleScene } from "./scenes/SampleScene";
import { DistributionScene } from "./scenes/DistributionScene";
import { RelationshipScene } from "./scenes/RelationshipScene";
import { OutlierScene } from "./scenes/OutlierScene";
import { IndependenceScene } from "./scenes/IndependenceScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { DataPanel } from "./DataPanel";
import type { SceneProps } from "./SceneFrame";
import "./deck.css";

const SCENES: Array<ComponentType<SceneProps> | null> = [
  TitleScene,
  GuessScene,
  SampleScene,
  DistributionScene,
  RelationshipScene,
  OutlierScene,
  IndependenceScene,
  ClosingScene,
];

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
  const { sample, regenerate } = useSample();
  const reduced = useReducedMotion();
  const sceneCount = SCENE_NOTES.length;
  const { index, direction, goTo, next, prev } = useDeck(sceneCount);
  const [notesOpen, setNotesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentNote = SCENE_NOTES[index];
  const ActiveScene = SCENES[index];

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
        if (dataOpen) {
          setDataOpen(false);
          event.preventDefault();
        } else if (notesOpen) {
          setNotesOpen(false);
          event.preventDefault();
        }
        return;
      }

      if (interactive) return;

      if ((notesOpen || dataOpen) && !["n", "N", "d", "D"].includes(event.key)) return;

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
          setDataOpen(false);
          setNotesOpen((open) => !open);
          break;
        case "d":
        case "D":
          event.preventDefault();
          setNotesOpen(false);
          setDataOpen((open) => !open);
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
  }, [dataOpen, goTo, next, notesOpen, prev, regenerate, sceneCount, toggleFullscreen]);

  const variants = reduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (move: number) => ({
          opacity: 0,
          x: move > 0 ? 84 : -84,
          y: 10,
          scale: 0.994,
          filter: "blur(5px)",
        }),
        center: { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" },
        exit: (move: number) => ({
          opacity: 0,
          x: move > 0 ? -70 : 70,
          y: -6,
          scale: 0.996,
          filter: "blur(5px)",
        }),
      };

  return (
    <div className="deck-stage">
      <header className="deck-topbar">
        <div className="deck-masthead">
          <span className="deck-masthead-mark" aria-hidden="true">Σ</span>
          <div className="min-w-0">
            <p className="deck-masthead-title">Estadística Uno</p>
            <p className="deck-masthead-meta">Tecnología y rendimiento · Vol. 1 · 2026</p>
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
            onClick={regenerate}
          >
            <RefreshCw aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            className="deck-icon-button"
            data-active={dataOpen}
            title="Datos de la muestra (D)"
            aria-label="Mostrar panel de datos"
            aria-expanded={dataOpen}
            onClick={() => {
              setNotesOpen(false);
              setDataOpen((open) => !open);
            }}
          >
            <Database aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            className="deck-icon-button"
            data-active={notesOpen}
            title="Notas del presentador (N)"
            aria-label="Mostrar notas del presentador"
            aria-expanded={notesOpen}
            onClick={() => {
              setDataOpen(false);
              setNotesOpen((open) => !open);
            }}
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

      <motion.div
        key={`rule-${index}`}
        className="deck-transition-rule"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1"
          >
            {ActiveScene ? (
              <ActiveScene
                onNext={next}
                onRestart={() => goTo(0)}
                onOpenData={() => {
                  setNotesOpen(false);
                  setDataOpen(true);
                }}
              />
            ) : (
              <PlaceholderScene index={index} />
            )}
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

        <span className="deck-hint ml-4 hidden xl:block">
          UNAN-León · Ingeniería en Sistemas
        </span>
        <p className="deck-hint ml-auto hidden sm:block">
          Flechas para navegar · D datos · N notas · F pantalla completa
        </p>
        <p className="deck-hint ml-auto tabular-nums sm:hidden">Semilla {sample.seed}</p>
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
            <p className="mt-6 border-t border-border pt-3 text-[0.66rem] leading-relaxed text-faint">
              Muestra fija de {sample.n} registros · semilla{" "}
              <span className="font-mono text-muted">{sample.seed}</span>. Las notas solo las ves
              vos.
            </p>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {dataOpen ? <DataPanel onClose={() => setDataOpen(false)} /> : null}
      </AnimatePresence>
    </div>
  );
}
