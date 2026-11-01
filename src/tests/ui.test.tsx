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

mock.module("../components/charts/charts", () => ({
  BarFrequencyChart: () => null,
  HistogramChart: () => null,
  DoughnutChart: () => null,
  ScatterRegressionChart: () => null,
  ComparisonChart: () => null,
}));

const { cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react");
const { App } = await import("../App");

afterEach(() => cleanup());
afterAll(() => GlobalRegistrator.unregister());

test("monta la aplicación y muestra la muestra inicial", async () => {
  render(createElement(App));

  expect(
    screen.getAllByRole("heading", {
      name: /tecnología y rendimiento académico universitario/i,
    }).length,
  ).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: /base de datos interactiva/i })).toBeTruthy();
  expect(screen.getByRole("heading", { name: /cuestionario y variables/i })).toBeTruthy();
  expect(screen.getAllByText(/datos sintéticos/i).length).toBeGreaterThan(0);
});

test("genera una nueva muestra y muestra el aviso", async () => {
  render(createElement(App));
  const buttons = screen.getAllByRole("button", { name: /nueva muestra/i });
  const headerButton = buttons[0];
  expect(headerButton).toBeTruthy();
  if (headerButton) fireEvent.click(headerButton);
  expect(await screen.findByText(/nueva muestra generada/i)).toBeTruthy();
});

test("cambia el tema y lo aplica al documento", async () => {
  render(createElement(App));
  fireEvent.click(screen.getByRole("button", { name: /tema actual/i }));
  const option = await screen.findByRole("menuitemradio", { name: /rosé pine moon/i });
  fireEvent.click(option);
  await waitFor(() => {
    expect(document.documentElement.dataset.theme).toBe("rose-pine");
  });
});

test("aplica un filtro global y actualiza el contador", async () => {
  render(createElement(App));
  const career = screen.getByLabelText("Carrera");
  fireEvent.change(career, { target: { value: "Medicina" } });
  await waitFor(() => {
    const badges = screen.getAllByText(/de 80 registros/i);
    expect(badges.length).toBeGreaterThan(0);
  });
});
