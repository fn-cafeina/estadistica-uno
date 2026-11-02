import { afterAll, afterEach, expect, test } from "bun:test";

process.env.NODE_ENV = "test";

const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
GlobalRegistrator.register();
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act, cleanup, fireEvent, render, screen, waitFor, within } = await import("@testing-library/react");
const { App } = await import("../App");

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function goto(id: string) {
  act(() => {
    window.location.hash = `#${id}`;
    window.dispatchEvent(new Event("hashchange"));
  });
}
afterAll(() => GlobalRegistrator.unregister());

test("abre en el laboratorio con el tema y el equipo", async () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /tecnología y rendimiento académico universitario/i }),
  ).toBeTruthy();
  expect(screen.getByText("Jasmir Moisés Medina Pérez")).toBeTruthy();
  expect(screen.getByText("Samuel Santiago Salgado Selva")).toBeTruthy();
  expect(screen.getByText("Gonzalo Javier Blanco Cardoza")).toBeTruthy();
  expect(screen.getByText("Franklin Isaac Aguirre Zamora")).toBeTruthy();
  expect(screen.getAllByText(/datos sintéticos con fines educativos/i).length).toBeGreaterThan(0);
});

test("incluye las ocho secciones del laboratorio", async () => {
  render(<App />);

  for (const label of [
    "Inicio",
    "Cuestionario",
    "Base de datos",
    "Frecuencias",
    "Descriptiva",
    "Pruebas",
    "Gráficos",
    "Interpretación",
  ]) {
    expect(screen.getByRole("link", { name: label })).toBeTruthy();
  }
});

test("muestra el cuestionario y la base de datos", async () => {
  render(<App />);

  const questionnaire = document.getElementById("cuestionario");
  const database = document.getElementById("base-datos");
  expect(questionnaire).toBeTruthy();
  expect(database).toBeTruthy();
  expect(within(questionnaire!).getByText(/¿Cuál es tu edad\?/i)).toBeTruthy();
  expect(within(database!).getByText(/desliza horizontalmente/i)).toBeTruthy();
});

test("filtra la base y actualiza el conteo visible", async () => {
  render(<App />);
  const database = document.getElementById("base-datos");
  expect(database).toBeTruthy();

  const career = within(database!).getByLabelText("Carrera");
  fireEvent.change(career, { target: { value: "Medicina" } });

  await waitFor(() => {
    const visible = within(database!).getByText(/de 80 registros/i);
    expect(visible.textContent).not.toBe("80 de 80 registros");
  });
});

test("genera una nueva muestra y conserva el laboratorio", async () => {
  render(<App />);
  fireEvent.click(screen.getAllByRole("button", { name: /nueva muestra/i })[0]!);
  expect(screen.getAllByText(/muestra fija de 80/i).length).toBeGreaterThan(0);
});

test("muestra frecuencias, descriptiva, pruebas y gráficos", async () => {
  render(<App />);

  goto("frecuencias");
  expect(screen.getByRole("heading", { name: /cómo se reparten los datos/i })).toBeTruthy();
  goto("descriptiva");
  expect(screen.getByRole("heading", { name: /el centro y la dispersión/i })).toBeTruthy();
  goto("pruebas");
  expect(screen.getByRole("heading", { name: /qué se puede sostener/i })).toBeTruthy();
  goto("graficos");
  expect(screen.getByRole("heading", { name: /mirar los datos también/i })).toBeTruthy();
  expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
});

test("resume la variable descriptiva en cuatro cifras y una tabla", async () => {
  render(<App />);
  goto("descriptiva");
  const descriptive = document.getElementById("descriptiva");
  expect(descriptive).toBeTruthy();
  expect(descriptive!.querySelectorAll(".lab-metric").length).toBe(4);

  const extra = within(descriptive!).getByRole("table", { name: /estadísticos adicionales/i });
  expect(within(extra).getAllByRole("row").length).toBe(13);
  for (const label of ["Clase modal", "Rango", "Varianza", "P90", "Atípicos"]) {
    expect(within(extra).getByText(label)).toBeTruthy();
  }
});

test("abre un procedimiento por sub-ruta y deja los demás montados", async () => {
  render(<App />);
  goto("pruebas/pearson");
  const tests = document.getElementById("pruebas")!;

  const active = tests.querySelectorAll(".lab-procedure[data-active='true']");
  expect(active.length).toBe(1);
  expect(active[0]?.textContent).toContain("Correlación de Pearson");
  // Los otros procedimientos siguen en el DOM para que la impresión no pierda ninguno.
  expect(tests.querySelectorAll(".lab-procedure").length).toBe(3);
  expect(within(tests).getByRole("link", { name: /regresión/i })).toBeTruthy();
});

test("cae al primer procedimiento si la sub-ruta no existe", async () => {
  render(<App />);
  goto("graficos/no-existe");
  const charts = document.getElementById("graficos")!;

  const active = charts.querySelectorAll(".lab-chart.lab-procedure[data-active='true']");
  expect(active.length).toBe(1);
  expect(active[0]?.textContent).toContain("Frecuencia por categoría");
  expect(charts.querySelectorAll(".lab-chart.lab-procedure[data-active='false']").length).toBe(4);
});

test("expone hipótesis y genera la tabla de contingencia", async () => {
  render(<App />);
  goto("pruebas");
  const tests = document.getElementById("pruebas");
  expect(tests).toBeTruthy();
  expect(within(tests!).getAllByText(/H₀:/).length).toBeGreaterThan(0);
  expect(within(tests!).getAllByText(/H₁:/).length).toBeGreaterThan(0);
  expect(within(tests!).getByRole("button", { name: /esperadas/i })).toBeTruthy();
  expect(within(tests!).getAllByText(/¿cómo se interpreta\?/i).length).toBeGreaterThan(0);
});

test("incluye la síntesis y el botón de impresión", async () => {
  render(<App />);
  goto("interpretacion");
  expect(screen.getByRole("heading", { name: /lo que muestran los datos/i })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /imprimir reporte/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/lo que no se puede concluir/i).length).toBeGreaterThan(0);
});
