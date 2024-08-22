import react from "@vitejs/plugin-react";
import postcssAtRulesVariables from "postcss-at-rules-variables";
import postcssEach from "postcss-each";
import postcssImport from "postcss-import";
import postcssModulesValues from "postcss-modules-values";
import postcssNesting from "postcss-nesting";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

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
