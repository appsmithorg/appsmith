const assert = require("assert");
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
    {
      // Prioritize the local src directory over node_modules.
      // This matters for cases where `src/<dirname>` and `node_modules/<dirname>` both exist –
      // e.g., when `<dirname>` is `entities`: https://github.com/appsmithorg/appsmith/pull/20964#discussion_r1124782356
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
    // Emit the main `script` without a `defer` attribute. This increases its priority
    // from Low to High (doc: https://addyosmani.com/blog/script-priorities/) and prevents it
    // from competing with `<link rel="preload"`>s in `index.html`, which are also Low.
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          const htmlWebpackPlugin = webpackConfig.plugins.find(
            (plugin) => plugin.constructor.name === "HtmlWebpackPlugin",
          );

          // CRA must include HtmlWebpackPlugin: https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/webpack.config.js#L608-L632
          // If it doesn’t, perhaps the version of CRA has changed, or plugin names got mangled?
          assert(
            htmlWebpackPlugin,
            "Cannot find HtmlWebpackPlugin in webpack config",
          );

          // HtmlWebpackPlugin must have the userOptions field: https://github.com/jantimon/html-webpack-plugin/blob/d5ce5a8f2d12a2450a65ec51c285dd54e36cd921/index.js#L34.
          // If it doesn’t, perhaps the version of HtmlWebpackPlugin has changed?
          assert(
            htmlWebpackPlugin.userOptions,
            "htmlWebpackPlugin.userOptions must be defined",
          );

          htmlWebpackPlugin.userOptions.inject = "head";
          htmlWebpackPlugin.userOptions.scriptLoading = "blocking";

          return webpackConfig;
        },
      },
    },
  ],
};
