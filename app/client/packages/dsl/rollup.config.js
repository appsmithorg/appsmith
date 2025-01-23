import peerDepsExternal from "rollup-plugin-peer-deps-external";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

export default {
  input: ["./src/index.ts"],
  output: [
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      entryFileNames: "index.es.js",
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "auto"
    },
    {
      dir: "dist",
      format: "cjs",
      sourcemap: true,
      entryFileNames: "index.js",
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "auto"
    }
  ],
  plugins: [
    peerDepsExternal(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          declarationDir: "dist",
          sourceMap: true
        },
        exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"]
      }
    }),
    json()
  ]
};
