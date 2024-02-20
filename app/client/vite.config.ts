import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: "/src",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@appsmith": fileURLToPath(new URL("./src/ce", import.meta.url)),
      "core-js": "core-js/stable",
      // for TypeScript path alias import like : @/x/y/z
    },
  },
  esbuild: {
    loader: "tsx",
    include: ["core-js"],
  },
});
