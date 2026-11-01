import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Database,
  GraduationCap,
  Monitor,
  Search,
  Sigma,
  TrendingUp,
  Users,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { mean } from "../stats/descriptive";
import { pearsonCorrelation } from "../stats/correlation";
import { linearRegression } from "../stats/regression";
import { correlationText, formatEquation, formatNumber } from "../lib/format";
import { ScatterRegressionChart } from "../components/charts/charts";
import { Badge, Button, Card, Metric } from "../components/ui";

export function Hero() {
  const { state, filteredRows, openHelp } = useApp();
  const reduced = useReducedMotion();

  const gpaValues = filteredRows.map((row) => row.gpa);
  const screenValues = filteredRows.map((row) => row.screenHours);
  const studyValues = filteredRows.map((row) => row.studyHours);

  const averageGpa = mean(gpaValues);
  const averageScreen = mean(screenValues);
  const correlation = pearsonCorrelation(studyValues, gpaValues);
  const regression = linearRegression(studyValues, gpaValues);

  const intro = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

  return (
    <section id="inicio" className="relative overflow-hidden pb-10 pt-10 sm:pb-14 sm:pt-14">
      <div aria-hidden="true" className="hero-decor pointer-events-none absolute inset-0 z-0">
        <div className="hero-grid absolute inset-0" />
        <div className="hero-glow absolute inset-x-0 top-0 h-[30rem]" />
      </div>

      <motion.div {...intro} className="relative z-10 grid items-start gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent" icon={Database}>
              Datos sintéticos
            </Badge>
            <span className="text-[0.68rem] font-medium text-faint">
              UNAN-León · Ingeniería en Sistemas · 2026
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-fg sm:text-5xl lg:text-6xl">
            Tecnología y{" "}
            <span className="text-accent">rendimiento académico</span> universitario
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Un laboratorio interactivo para describir una muestra, comparar grupos, medir
            asociaciones y entender qué dicen los números. Sin instalar nada y sin escribir una
            línea de código.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#base-datos" className="btn btn-primary">
              Explorar la muestra
              <ArrowRight aria-hidden="true" size={16} />
            </a>
            <Button variant="secondary" icon={BookOpen} onClick={openHelp}>
              Cómo leer la app
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Registros"
              value={filteredRows.length === state.sample.n ? String(state.sample.n) : String(filteredRows.length)}
              hint={
                filteredRows.length === state.sample.n
                  ? "Muestra sintética activa"
                  : `De ${state.sample.n} en la muestra`
              }
              icon={Users}
              accent
            />
            <Metric
              label="Promedio medio"
              value={formatNumber(averageGpa, 1)}
              hint="Puntos sobre 100"
              icon={GraduationCap}
            />
            <Metric
              label="Pantalla al día"
              value={formatNumber(averageScreen, 1)}
              hint="Horas fuera de clase"
              icon={Monitor}
            />
            <Metric
              label="Correlación r"
              value={correlation ? formatNumber(correlation.r, 2) : "—"}
              hint="Estudio y promedio"
              icon={TrendingUp}
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-surface/60 px-3.5 py-3">
            <Sigma aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-fg">Lectura rápida. </span>
              {correlation
                ? `${correlationText(correlation.r, correlation.strength, correlation.direction)} En esta muestra, r = ${formatNumber(correlation.r, 2)}.`
                : "No hay suficientes filas visibles para calcular una correlación."}
            </p>
          </div>
        </div>

        <div className="hero-visual relative">
          <Card className="card-raised relative overflow-hidden p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  <TrendingUp aria-hidden="true" size={13} />
                  Vista rápida
                </p>
                <h2 className="mt-1 text-lg font-semibold text-fg">Horas de estudio y promedio</h2>
                <p className="mt-1 text-xs text-muted">
                  Cada punto es un registro de la muestra visible.
                </p>
              </div>
              <Badge tone="accent">r = {correlation ? formatNumber(correlation.r, 2) : "—"}</Badge>
            </div>

            <div className="mt-4 h-64 sm:h-72">
              {correlation && regression ? (
                <ScatterRegressionChart
                  correlation={correlation}
                  regression={regression}
                  xLabel="Horas de estudio"
                  xUnit="h/semana"
                  yLabel="Promedio"
                  yUnit="puntos"
                  mini
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 px-6 text-center text-xs text-muted">
                  Se necesitan al menos tres registros con datos válidos para dibujar la dispersión.
                </div>
              )}
            </div>

            {regression ? (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <code className="truncate text-[0.7rem] text-muted">
                  {formatEquation(regression.slope, regression.intercept, "estudio", "promedio")}
                </code>
                <span className="shrink-0 text-[0.68rem] font-semibold text-faint">
                  R² = {formatNumber(regression.r2, 2)}
                </span>
              </div>
            ) : null}
          </Card>
        </div>
      </motion.div>

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Search,
            title: "Mira la muestra",
            text: "Revisa las variables, la tabla y los filtros. Todo lo que sigue se calcula desde esas filas.",
            href: "#base-datos",
          },
          {
            icon: Calculator,
            title: "Describe y compara",
            text: "Frecuencias, medidas de centro y dispersión, tablas cruzadas y asociaciones.",
            href: "#descriptiva",
          },
          {
            icon: BookOpen,
            title: "Interpreta con cautela",
            text: "Cada procedimiento incluye una explicación y una advertencia sobre sus límites.",
            href: "#interpretacion",
          },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <a
              key={step.title}
              href={step.href}
              className="card group p-4 transition-colors hover:border-border-strong hover:bg-surface-2/70"
            >
              <div className="flex items-center gap-2 text-accent">
                <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
                <span className="text-xs font-semibold">{step.title}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{step.text}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
