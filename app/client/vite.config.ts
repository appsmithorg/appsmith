import * as path from "path";
import envCompatible from "vite-plugin-env-compatible";
import vitePluginRequire from "vite-plugin-require";
import viteRawPlugin from "vite-raw-plugin";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import viteCompression from "vite-plugin-compression";
// import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const babelPlugins: any[] = [];
  const babelPresets: string[] = [];
  const configPlugins: any[] = [];

  if (command === "serve") {
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
    // build configurations
    configPlugins.push(
      viteCompression(),
      viteCompression({
        algorithm: "brotliCompress",
        threshold: 10240,
      }),
      // VitePWA({
      //   strategies: "injectManifest",
      //   srcDir: "src",
      //   filename: "serviceworker.js",
      //   mode: "development",
      //   workbox: {
      //     maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
      //   },
      // }),
    );
  }

  configPlugins.push(
    envCompatible(),
    vitePluginRequire(),
    viteRawPlugin({
      fileRegex: /_derived\.js$/,
    }),
    react({
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
    define: {
      global: {},
      __isBrowser__: true,
    },
    resolve: {
      alias: {
        actions: path.resolve(__dirname, "src/actions"),
        assets: path.resolve(__dirname, "src/assets"),
        "@appsmith": path.resolve(__dirname, "src/ee"),
        api: path.resolve(__dirname, "src/api"),
        ce: path.resolve(__dirname, "src/ce"),
        components: path.resolve(__dirname, "src/components"),
        comments: path.resolve(__dirname, "src/comments"),
        constants: path.resolve(__dirname, "src/constants"),
        entities: path.resolve(__dirname, "src/entities"),
        globalStyles: path.resolve(__dirname, "src/globalStyles"),
        icons: path.resolve(__dirname, "src/icons"),
        normalizers: path.resolve(__dirname, "src/normalizers"),
        notifications: path.resolve(__dirname, "src/notifications"),
        pages: path.resolve(__dirname, "src/pages"),
        reducers: path.resolve(__dirname, "src/reducers"),
        reflow: path.resolve(__dirname, "src/reflow"),
        resizable: path.resolve(__dirname, "src/resizable"),
        RouteBuilder: path.resolve(__dirname, "src/RouteBuilder"),
        sagas: path.resolve(__dirname, "src/sagas"),
        selectors: path.resolve(__dirname, "src/selectors"),
        store: path.resolve(__dirname, "src/store"),
        templates: path.resolve(__dirname, "src/templates"),
        transformers: path.resolve(__dirname, "src/transformers"),
        utils: path.resolve(__dirname, "src/utils"),
        widgets: path.resolve(__dirname, "src/widgets"),
        workers: path.resolve(__dirname, "src/workers"),
      },
    },
    plugins: configPlugins,
  };
});
