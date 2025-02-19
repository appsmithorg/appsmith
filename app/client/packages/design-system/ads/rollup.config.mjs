import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import postcssImport from "postcss-import";
import copy from "rollup-plugin-copy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import url from "@rollup/plugin-url";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";
import image from "@rollup/plugin-image";
import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const BUILD_DIR = path.resolve(__dirname, "build");

// Only external dependencies should be React and ReactDOM
const EXTERNALS = ["react", "react-dom"];

export default {
  input: path.resolve(__dirname, "src/index.ts"),
  output: {
    dir: path.resolve(BUILD_DIR, "esm"),
    format: "esm",
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
    assetFileNames: (assetInfo) => {
      if (assetInfo.name === "design-system.css") {
        return "css/design-system.css";
      }

      return assetInfo.name;
    },
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
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      esmExternals: true,
    }),
    url({
      limit: 0,
      include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif"],
    }),
    image(),
    babel({
      exclude: "node_modules/**",
      presets: [
        "@babel/preset-react",
        "@babel/preset-typescript",
        [
          "@babel/preset-env",
          {
            modules: false,
            targets: "> 0.25%, not dead",
            useBuiltIns: false,
          },
        ],
      ],
      babelHelpers: "bundled",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    }),
    postcss({
      minimize: true,
      sourceMap: true,
      extract: "design-system.css",
      inject: false,
      plugins: [
        postcssImport({
          path: ["src/__theme__/default"],
        }),
      ],
    }),
    copy({
      targets: [
        {
          src: "src/__theme__/default/fonts/*",
          dest: path.resolve(BUILD_DIR, "css/fonts"),
        },
      ],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: path.resolve(BUILD_DIR, "esm"),
      rootDir: "src",
      outDir: path.resolve(BUILD_DIR, "esm"),
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
      },
    }),
  ],
};
