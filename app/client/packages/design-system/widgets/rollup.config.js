import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import { defineConfig } from "rollup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const BUILD_DIR = path.resolve(__dirname, "build"); // build
const UMD_DIR = path.resolve(BUILD_DIR, "umd"); // build/umd

const EXTERNALS = ["react", "react-dom"];

export default defineConfig({
  input: path.resolve(__dirname, "src/index.ts"),
  output: {
    file: path.resolve(UMD_DIR, "design-system.js"),
    format: "umd",
    name: "JsArtisanTest",
    sourcemap: true,
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    inlineDynamicImports: true,
    extend: true,
    exports: "named",
  },
  external: EXTERNALS,
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.REACT_APP_ENV": JSON.stringify("production"),
      },
    }),
    nodeResolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      browser: true,
      preferBuiltins: false,
      dedupe: EXTERNALS,
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      esmExternals: true,
      ignoreDynamicRequires: true,
      ignoreTryCatch: true,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      module: "esnext",
      outDir: UMD_DIR,
      noForceEmit: true,
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
      inject: true,
      minimize: true,
      extract: false,
      modules: true,
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        drop_console: true,
      },
    }),
  ],
  preserveEntrySignatures: false,
  treeshake: {
    propertyReadSideEffects: false,
    moduleSideEffects: false,
  },
});
