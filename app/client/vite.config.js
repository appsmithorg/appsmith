const path = require("path");
const envCompatible = require("vite-plugin-env-compatible");
const vitePluginRequire = require("vite-plugin-require");
const viteRawPlugin = require("vite-raw-plugin");
const react = require("@vitejs/plugin-react");
const svgrPlugin = require("vite-plugin-svgr");
const viteCompression = require("vite-plugin-compression");
const viteSentry = require("vite-plugin-sentry");
const { VitePWA } = require("vite-plugin-pwa");
const { defineConfig, loadEnv } = require("vite");
const tsconfigPaths = require("vite-tsconfig-paths");
const { fileURLToPath } = require("url");
// // node-externals.ts
// const rrequire = createRequire(import.meta.url);
// const { externals } = rrequire('rollup-plugin-node-externals');


// const externals = Object.keys(pkg.dependencies);
// const externalObj = externals.reduce((acc, external) => {
//   acc[external] = external.replace('@', '').replace('/', '__').replace('if', '').replace('needed', '');
//   return acc;
// }, {});

// console.log({externalObj})
// const nodeExternals = require("rollup-plugin-node-externals");

export default defineConfig(({ command, mode }) => {
  /*
    Loading Env variables in vite
    https://stackoverflow.com/questions/66389043/how-can-i-use-vite-env-variables-in-vite-config-js
  */
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  const babelPlugins = [];
  const babelPresets = [];
  const configPlugins = [];
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
      // viteCompression({
      //   algorithm: "brotliCompress",
      //   threshold: 10240,
      // }),
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
    tsconfigPaths.default(),
    envCompatible.default(),
    vitePluginRequire.default(),
    // viteRawPlugin({
    //   fileRegex: /_derived\.js$/,
    // }),
    // createExternal({
    //   externals: {...externalObj, 'react': 'React'}
    // }),
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
    svgrPlugin.default(),
  );

  return {
    build: {
      outDir: "build",
      rollupOptions: {
        external: ['core-js', 'simplebar', 'rc-tree-select']
      }
    },
    server: {
      host: "dev.appsmith.com",
      port: 3000,
      strictPort: true,
      watch: {
        usePolling: true
      }
      // hmr: {
      //   protocol: "ws",
      //   host: "localhost",
      //   port: 3000,
      // },
    },
    define,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@appsmith": fileURLToPath(new URL("./src/ee", import.meta.url)),
        // "core-js": "core-js/stable",
      },
    },
    plugins: configPlugins,
  };
});
