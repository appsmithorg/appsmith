import peerDepsExternal from "rollup-plugin-peer-deps-external";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import generatePackageJson from "rollup-plugin-generate-package-json";
import packageJson from "./package.json";
import json from "@rollup/plugin-json";

export default {
  // TODO: Figure out regex where each directory can be a separate module without having to manually add them
  input: ["./src/index.ts"],
  output: [
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    json(),
    generatePackageJson({
      baseContents: (pkg) => ({
        ...pkg,
        main: "index.js",
        module: "index.es.js",
        types: "index.d.ts",
      }),
    }),
  ],
};
