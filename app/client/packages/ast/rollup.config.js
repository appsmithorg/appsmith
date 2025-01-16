import peerDepsExternal from "rollup-plugin-peer-deps-external";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import generatePackageJson from "rollup-plugin-generate-package-json";
import packageJson from "./package.json";

export default {
  // TODO: Figure out regex where each directory can be a separate module without having to manually add them
  input: ["./index.ts"],
  output: [
    {
      file: "build/index.es.js",
      format: "esm",
      sourcemap: false,
    },
    {
      file: "build/index.js",
      format: "cjs",
      sourcemap: false,
    },
  ],
  plugins: [
    peerDepsExternal(),
    commonjs(),
    typescript({ 
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          declarationDir: "build",
        },
      },
    }),
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
