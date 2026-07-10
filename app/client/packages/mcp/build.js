import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  format: "esm",
  minify: true,
  platform: "node",
  sourcemap: true,
  target: `node${process.versions.node}`,
  outdir: "dist/bundle",
});
