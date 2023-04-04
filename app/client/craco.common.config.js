const assert = require("assert");
const CracoAlias = require("craco-alias");
const CracoBabelLoader = require("craco-babel-loader");
const path = require("path");
const webpack = require("webpack");
const IconChunkNamingPlugin = require("./webpack/IconChunkNamingPlugin");

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
        // Give icon chunks names like `icon.dfd465bd.chunk.js` instead of `35140.dfd465bd.chunk.js`
        new IconChunkNamingPlugin(),
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
    // Emit dedicated HTML files for edit and view modes. This is done as an optimization (to preload
    // route-specific chunks on the most critical routes) and doesn’t affect the actual app behavior.
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

          // Instead of requiring HtmlWebpackPlugin directly, use the same version that CRA uses
          const HtmlWebpackPlugin = htmlWebpackPlugin.constructor;

          const htmlWebpackPluginForEditMode = new HtmlWebpackPlugin({
            ...htmlWebpackPlugin.userOptions,
            filename: "edit.html",
            // This option isn’t used by HtmlWebpackPlugin itself – instead, it’s passed to
            // our custom template
            appsmithHtmlTarget: "edit-mode",
          });
          const htmlWebpackPluginForViewMode = new HtmlWebpackPlugin({
            ...htmlWebpackPlugin.userOptions,
            filename: "view.html",
            // This option isn’t used by HtmlWebpackPlugin itself – instead, it’s passed to
            // our custom template
            appsmithHtmlTarget: "view-mode",
          });

          webpackConfig.plugins.push(
            htmlWebpackPluginForEditMode,
            htmlWebpackPluginForViewMode,
          );

          return webpackConfig;
        },
      },
    },
  ],
};
