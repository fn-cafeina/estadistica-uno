import { afterAll, afterEach, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";

process.env.NODE_ENV = "test";

const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
GlobalRegistrator.register();
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

const { createElement } = await import("react");

const motion = new Proxy(
  {},
  {
    get: (_target, tag) =>
      ({
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileInView: _whileInView,
        viewport: _viewport,
        variants: _variants,
        ...props
      }: Record<string, unknown>) =>
        createElement(String(tag), props),
  },
);

mock.module("motion/react", () => ({
  motion,
  AnimatePresence: ({ children }: { children?: ReactNode }) => children,
  useReducedMotion: () => true,
}));

mock.module("../presentation/visuals/AnimatedNumber", () => ({
  AnimatedNumber: ({
    value,
    digits = 1,
    prefix = "",
    suffix = "",
  }: {
    value: number | null | undefined;
    digits?: number;
    prefix?: string;
    suffix?: string;
  }) =>
    createElement(
      "span",
      null,
      value === null || value === undefined ? "s/d" : `${prefix}${value.toFixed(digits)}${suffix}`,
    ),
}));

const { cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react");
const { App } = await import("../App");

afterEach(() => cleanup());
afterAll(() => GlobalRegistrator.unregister());

test("abre en la portada de la presentación", async () => {
  render(createElement(App));

  expect(
    screen.getByRole("heading", { name: /tecnología y rendimiento académico/i }),
  ).toBeTruthy();
  expect(screen.getAllByText(/01 \/ 09/i).length).toBeGreaterThan(0);
});

test("un click en el escenario no cambia de escena", async () => {
  const { container } = render(createElement(App));
  const stage = container.querySelector(".deck-stage");
  expect(stage).toBeTruthy();

  fireEvent.click(stage!);

  expect(
    screen.getByRole("heading", { name: /tecnología y rendimiento académico/i }),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: /quiénes presentan/i })).toBeNull();
});

test("avanza con el botón y con la flecha derecha", async () => {
  render(createElement(App));

  fireEvent.click(screen.getByRole("button", { name: /empezar/i }));
  expect(
    await screen.findByRole("heading", { name: /quiénes presentan/i }),
  ).toBeTruthy();

  fireEvent.keyDown(document.body, { key: "ArrowRight" });
  expect(await screen.findByRole("heading", { name: /^la pregunta/i })).toBeTruthy();
});

test("presenta al grupo en la introducción", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /empezar/i }));

  for (const name of [
    "Jasmir Moisés Medina Pérez",
    "Samuel Santiago Salgado Selva",
    "Gonzalo Javier Blanco Cardoza",
    "Franklin Isaac Aguirre Zamora",
  ]) {
    expect(await screen.findByText(name)).toBeTruthy();
  }
});

test("abre y cierra el panel de datos", async () => {
  render(createElement(App));

  fireEvent.click(screen.getByRole("button", { name: /mostrar panel de datos/i }));
  expect(await screen.findByRole("dialog", { name: /panel de datos/i })).toBeTruthy();
  expect(screen.getByRole("heading", { name: /^la muestra$/i })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /cerrar panel de datos/i }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: /panel de datos/i })).toBeNull();
  });
});

test("muestra y oculta las notas del presentador", async () => {
  render(createElement(App));

  fireEvent.click(screen.getByRole("button", { name: /mostrar notas del presentador/i }));
  expect(await screen.findByText(/presentamos el tema/i)).toBeTruthy();

  fireEvent.keyDown(document.body, { key: "Escape" });
  await waitFor(() => {
    expect(screen.queryByText(/presentamos el tema/i)).toBeNull();
  });
});

test("regenera la muestra desde la barra superior y mantiene n = 80", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /generar nueva muestra/i }));
  fireEvent.click(screen.getByRole("button", { name: /mostrar panel de datos/i }));
  expect(await screen.findByText(/muestra fija · n = 80/i)).toBeTruthy();
});

test("las tablas quedan dentro de contenedores con scroll", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /mostrar panel de datos/i }));
  await screen.findByRole("dialog", { name: /panel de datos/i });
  expect(document.querySelectorAll(".deck-table-wrap").length).toBeGreaterThan(0);
});

test("navega a la prueba y alterna observado con esperado", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /ir a la escena 8/i }));
  expect(
    await screen.findByRole("heading", { name: /uso y rendimiento/i }),
  ).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /^esperado$/i }));
  expect(await screen.findByText(/esperado = si no hubiera relación/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /^observado$/i }));
  expect(await screen.findByText(/conteos reales de la muestra/i)).toBeTruthy();
});

test("cierra con conclusión y gracias", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /ir a la escena 9/i }));
  expect(
    await screen.findByRole("heading", { name: /los datos no hablan solos/i }),
  ).toBeTruthy();
  expect(await screen.findByText(/^gracias\.$/i)).toBeTruthy();
});

test("cambia las pestañas del panel de datos", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /mostrar panel de datos/i }));
  fireEvent.click(await screen.findByRole("tab", { name: /resumen/i }));
  expect(await screen.findByText(/promedio medio/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: /muestra/i }));
  expect(await screen.findByText(/carrera/i)).toBeTruthy();
});
