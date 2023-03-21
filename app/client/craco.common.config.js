const CracoAlias = require("craco-alias");
const CracoBabelLoader = require("craco-babel-loader");
const path = require("path");
const webpack = require("webpack");

module.exports = {
  devServer: {
    client: {
      webSocketURL: {
        hostname: "127.0.0.1",
        pathname: "/ws",
        port: 3000,
        protocol: "ws",
      },
    },
  },
  babel: {
    plugins: ["babel-plugin-lodash"],
  },
  webpack: {
    configure: {
      resolve: {
        alias: {
          "lodash-es": "lodash",
        },
        fallback: {
          assert: false,
          stream: false,
          util: false,
          fs: false,
          os: false,
          path: false,
        },
      },
      module: {
        rules: [
          {
            test: /\.m?js/,
            resolve: { fullySpecified: false },
          },
        ],
      },
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ],
      plugins: [
        // Replace BlueprintJS’s icon component with our own implementation
        // that code-splits icons away
        new webpack.NormalModuleReplacementPlugin(
          /@blueprintjs\/core\/lib\/\w+\/components\/icon\/icon\.\w+/,
          require.resolve(
            "./src/components/designSystems/blueprintjs/icon/index.js",
          ),
        ),
      ],
    },
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: "./src",
        // tsConfigPath should point to the file where "baseUrl" and "paths" are specified
        tsConfigPath: "./tsconfig.path.json",
      },
    },
    {
      plugin: CracoBabelLoader,
      options: {
        includes: [path.resolve("packages")],
      },
    },
    {
      plugin: "prismjs",
      options: {
        languages: ["javascript"],
        plugins: [],
        theme: "twilight",
        css: false,
      },
    },
    // Prioritize the local src directory over node_modules.
    // This matters for cases where `src/<dirname>` and `node_modules/<dirname>` both exist –
    // e.g., when `<dirname>` is `entities`: https://github.com/appsmithorg/appsmith/pull/20964#discussion_r1124782356
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          webpackConfig.resolve.modules = [
            path.resolve(__dirname, "src"),
            ...webpackConfig.resolve.modules,
          ];
          return webpackConfig;
        },
      },
    },
    // Use the `exnext` field to resolve package contents when it’s available.
    // `esnext` is a (mostly extinct) package.json field that (when available) points to the
    // files transpiled for the modern browsers: https://2ality.com/2017/04/transpiling-dependencies-babel.html#proposal%3A-pkg.esnext
    // The reason we configure this field is (primarily) to use the modern version of Blueprint;
    // in the transpiled version, the `HotkeysTarget` decorator throws an `class cannot be invoked without 'new'` error.
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // Per https://webpack.js.org/configuration/resolve/#resolvemainfields
          const defaultMainFields = ["browser", "module", "main"];

          webpackConfig.resolve.mainFields = [
            "esnext",
            ...(webpackConfig.resolve.mainFields ?? defaultMainFields),
          ];
          return webpackConfig;
        },
      },
    },
  ],
};
