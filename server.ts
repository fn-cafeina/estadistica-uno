import { resolveStaticPath } from "./src/lib/staticPath";

const dist = `${import.meta.dir}/dist`;
const port = Number(process.env.PORT ?? 3001);

const server = Bun.serve({
  port,
  async fetch(request) {
    const pathname = resolveStaticPath(new URL(request.url).pathname);
    if (pathname === null) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(`${dist}${pathname}`);
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (!pathname.includes(".")) {
      const index = Bun.file(`${dist}/index.html`);
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Preview en http://localhost:${server.port}`);
