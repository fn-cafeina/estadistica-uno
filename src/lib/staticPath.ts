/**
 * Resuelve el pathname de una petición hacia el directorio de salida del build.
 * Devuelve null si la ruta intenta escapar del directorio (path traversal).
 */
export function resolveStaticPath(pathname: string): string | null {
  if (pathname.includes("..")) return null;
  return pathname === "/" ? "/index.html" : pathname;
}
