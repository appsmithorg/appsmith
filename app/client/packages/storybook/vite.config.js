import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import postcssNesting from "postcss-nesting";
import postcssImport from "postcss-import";
import postcssAtRulesVariables from "postcss-at-rules-variables";
import postcssEach from "postcss-each";
import postcssModulesValues from "postcss-modules-values";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: "named",
        ref: true,
      },
      include: "**/*.svg",
    }),
  ],
  css: {
    postcss: {
      plugins: [
        postcssNesting,
        postcssImport,
        postcssAtRulesVariables,
        postcssEach,
        postcssModulesValues,
      ],
    },
  },
});
