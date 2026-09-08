import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  format: "esm",
  minify: true,
  platform: "node",
  sourcemap: true,
  target: `node${process.versions.node.split(".")[0]}`,
  // ESM output has no `require`, but bundled CommonJS deps (e.g. the mongodb driver) dynamically
  // require Node built-ins like "timers/promises". Recreate `require` from import.meta.url so those
  // resolve at runtime instead of throwing "Dynamic require of X is not supported".
  banner: {
    js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
  },
  outdir: "dist/bundle",
});
