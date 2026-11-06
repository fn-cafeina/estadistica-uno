import { describe, expect, test } from "bun:test";
import { resolveStaticPath } from "../lib/staticPath";

describe("resolveStaticPath", () => {
  test("resuelve la raíz a index.html", () => {
    expect(resolveStaticPath("/")).toBe("/index.html");
  });

  test("permite rutas normales de assets", () => {
    expect(resolveStaticPath("/assets/app.js")).toBe("/assets/app.js");
    expect(resolveStaticPath("/index.html")).toBe("/index.html");
  });

  test("rechaza traversal simple y percent-encoded", () => {
    expect(resolveStaticPath("/../package.json")).toBeNull();
    expect(resolveStaticPath("/..%2F..%2F..%2Fetc%2Fpasswd")).toBeNull();
    expect(resolveStaticPath("/assets/../../server.ts")).toBeNull();
  });

  test("un percent-encoding inválido no rompe la app: es solo una ruta 404", () => {
    expect(resolveStaticPath("/%zz")).toBe("/%zz");
  });
});
