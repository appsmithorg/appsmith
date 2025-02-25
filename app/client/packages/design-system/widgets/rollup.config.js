import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "rollup";

import postcssNesting from "postcss-nesting";
import postcssImport from "postcss-import";
import postcssAtRulesVariables from "postcss-at-rules-variables";
import postcssEach from "postcss-each";
import postcssModulesValues from "postcss-modules-values";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";

const BUILD_DIR = path.resolve(__dirname, "build");

const EXTERNALS = ["react", "react-dom"];

export default defineConfig({
  input: path.resolve(__dirname, "src/index.ts"),
  output: {
    file: path.resolve(BUILD_DIR, "bundle.js"),
    format: "esm",
    sourcemap: true,
    inlineDynamicImports: true,
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
  },
  external: EXTERNALS,
  plugins: [
    json(),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.REACT_APP_ENV": JSON.stringify("production"),
      },
    }), 
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      esmExternals: true,
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
      ],
      skipPreflightCheck: true,
      babelrc: false,
      configFile: false
    }),
    postcss({
      modules: true,
      minimize: true,
      sourceMap: true,
      plugins: [
        postcssNesting(),
        postcssImport(),
        postcssAtRulesVariables(),
        postcssEach(),
        postcssModulesValues(),
      ],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: path.resolve(BUILD_DIR),
      rootDir: "src",
      outDir: path.resolve(BUILD_DIR),
    }),
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      browser: true,
      preferBuiltins: false,
      dedupe: EXTERNALS,
    }),
  ],
});