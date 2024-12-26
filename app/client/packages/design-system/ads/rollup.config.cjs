import peerDepsExternal from "rollup-plugin-peer-deps-external";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import url from "@rollup/plugin-url";
import postcss from "rollup-plugin-postcss";
import path from "path";
import postcssImport from "postcss-import";
import terser from "@rollup/plugin-terser";
import image from "@rollup/plugin-image";
import copy from "rollup-plugin-copy";

export default {
  input: path.resolve(__dirname, "src/index.ts"),
  output: [
    {
      dir: path.resolve(__dirname, "build"), // Output directory
      format: "esm", // ES module output
      sourcemap: true,
      preserveModules: false,
    },
  ],
  external: (id) =>
    !id.startsWith(".") && !id.startsWith("/") && !id.includes("src"),

  plugins: [
    peerDepsExternal(), // Automatically exclude peer dependencies
    url(), // Handle asset imports
    commonjs(), // Convert CommonJS modules to ES6
    postcss({
      minimize: true,
      sourceMap: true,
      plugins: [postcssImport()],
      extract: path.resolve("build/css/design-system.css"),
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true, // Generate .d.ts files
      declarationDir: path.resolve("build/types"), // Align with Rollup output dir
      outDir: "./build", // Align JS output directory
    }),
    image(), // Handle image imports
    copy({
      targets: [{ src: "src/__assets__/fonts/*", dest: "build/css" }],
    }),
    terser(), // Minify JS output
  ],
};
