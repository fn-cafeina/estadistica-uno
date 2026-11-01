import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  plugins: [tailwind],
});

if (!result.success) {
  console.error("Build failed");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

for (const output of result.outputs) {
  console.log(`Built ${output.path}`);
}
