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

const { cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react");
const { App } = await import("../App");

afterEach(() => cleanup());
afterAll(() => GlobalRegistrator.unregister());

test("abre en la portada de la presentación", async () => {
  render(createElement(App));

  expect(
    screen.getByRole("heading", { name: /tecnología y rendimiento académico/i }),
  ).toBeTruthy();
  expect(screen.getAllByText(/80 estudiantes que no existen/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/01 \/ 08/i).length).toBeGreaterThan(0);
});

test("avanza con el botón y con la flecha derecha", async () => {
  render(createElement(App));

  fireEvent.click(screen.getByRole("button", { name: /empezar/i }));
  expect(
    await screen.findByRole("heading", { name: /antes de mirar los datos, apostá/i }),
  ).toBeTruthy();

  fireEvent.keyDown(document.body, { key: "ArrowRight" });
  expect(
    await screen.findByRole("heading", { name: /80 estudiantes que no existen/i }),
  ).toBeTruthy();
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
  expect(await screen.findByText(/no expliques nada todavía/i)).toBeTruthy();

  fireEvent.keyDown(document.body, { key: "Escape" });
  await waitFor(() => {
    expect(screen.queryByText(/no expliques nada todavía/i)).toBeNull();
  });
});

test("regenera la muestra desde la barra superior", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /generar nueva muestra/i }));
  expect(await screen.findByText(/semilla/i)).toBeTruthy();
});
