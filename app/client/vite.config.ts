import * as path from "path";
import envCompatible from "vite-plugin-env-compatible";
import vitePluginRequire from "vite-plugin-require";
import viteRawPlugin from "vite-raw-plugin";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import viteCompression from "vite-plugin-compression";
import viteSentry from "vite-plugin-sentry";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";
import pkg from "./package.json";

const externals = Object.keys(pkg.dependencies);

// const nodeExternals = require("rollup-plugin-node-externals");

export default defineConfig(({ command, mode }) => {
  /*
    Loading Env variables in vite
    https://stackoverflow.com/questions/66389043/how-can-i-use-vite-env-variables-in-vite-config-js
  */
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  const babelPlugins: any[] = [];
  const babelPresets: string[] = [];
  const configPlugins: any[] = [];
  const define = {};

  if (command === "serve") {
    define["global"] = {};
    define["__isBrowser__"] = true;
    // development configurations
    babelPresets.push("@babel/preset-typescript");
    babelPlugins.push("@babel/plugin-transform-typescript", [
      "babel-plugin-styled-components",
      {
        displayName: true,
        fileName: false,
      },
    ]);
  } else {
    if (
      process.env.REACT_APP_ENVIRONMENT == "PRODUCTION" ||
      process.env.REACT_APP_ENVIRONMENT === "STAGING"
    ) {
      if (
        process.env.SENTRY_AUTH_TOKEN != null &&
        process.env.SENTRY_AUTH_TOKEN !== ""
      ) {
        configPlugins.push(
          viteSentry({
            sourceMaps: {
              include: ["build"],
              ignore: ["node_modules"],
            },
            release: process.env.REACT_APP_SENTRY_RELEASE,
            deploy: {
              env: process.env.REACT_APP_SENTRY_ENVIRONMENT || "",
            },
          }),
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(
          "Sentry configuration missing in process environment. Sentry will be disabled.",
        );
      }
    }

    // build configurations
    configPlugins.push(
      viteCompression(),
      viteCompression({
        algorithm: "brotliCompress",
        threshold: 10240,
      }),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "serviceWorker.js",
        mode: "development",
        workbox: {
          maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
        },
      }),
    );
  }

  configPlugins.push(
    tsconfigPaths(),
    envCompatible(),
    vitePluginRequire(),
    viteRawPlugin({
      fileRegex: /_derived\.js$/,
    }),
    react({
      jsxRuntime: "classic",
      babel: {
        presets: babelPresets,
        plugins: babelPlugins,
        parserOpts: {
          plugins: ["decorators-legacy", "classProperties"],
        },
      },
    }),
    svgrPlugin(),
  );

  return {
    build: {
      outDir: "build",
      rollupOptions: {
        plugins: [...externals],
        // external: [
        //   "./src/workers/Evaluation/evaluation.worker.ts",
        //   "rc-tree-select",
        // ],
      },
    },
    server: {
      host: "dev.appsmith.com",
      port: 3000,
      strictPort: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 3000,
      },
    },
    define,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@appsmith": fileURLToPath(new URL("./src/ee", import.meta.url)),
        "core-js": "core-js/stable",
      },
    },
    plugins: configPlugins,
  };
});
