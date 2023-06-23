/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require("assert");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./craco.common.config.js");
const WorkboxPlugin = require("workbox-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");
const path = require("path");

const env = process.env.REACT_APP_ENVIRONMENT;
const isAirgap = process.env.REACT_APP_AIRGAP_ENABLED;
const plugins = [];

plugins.push(
  new WorkboxPlugin.InjectManifest({
    swSrc: "./src/serviceWorker.js",
    mode: "development",
    swDest: "./pageService.js",
    maximumFileSizeToCacheInBytes: 11 * 1024 * 1024,
    exclude: [
      // Don’t cache source maps and PWA manifests.
      // (These are the default values of the `exclude` option: https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-WebpackPartial,
      // so we need to specify them explicitly if we’re extending this array.)
      /\.map$/,
      /^manifest.*\.js$/,
      // Don’t cache the root html file
      /index\.html/,
      // Don’t cache LICENSE.txt files emitted by CRA
      // when a chunk includes some license comments
      /LICENSE\.txt/,
      // Don’t cache static icons as there are hundreds of them, and caching them all
      // one by one (as the service worker does it) keeps the network busy for a long time
      // and delays the service worker installation
      /\/*\.svg$/,
    ],
    // Don’t cache-bust JS and CSS chunks
    dontCacheBustURLsMatching: /\.[0-9a-zA-Z]{8}\.chunk\.(js|css)$/,
  }),
);

if (env === "PRODUCTION" || env === "STAGING") {
  if (
    process.env.SENTRY_AUTH_TOKEN != null &&
    process.env.SENTRY_AUTH_TOKEN !== ""
  ) {
    plugins.push(
      new SentryWebpackPlugin({
        include: "build",
        ignore: ["node_modules", "webpack.config.js"],
        release: process.env.REACT_APP_SENTRY_RELEASE,
        deploy: {
          env: process.env.REACT_APP_SENTRY_ENVIRONMENT,
        },
      }),
    );
  } else {
    console.log(
      "Sentry configuration missing in process environment. Sentry will be disabled.",
    );
  }
}
plugins.push(new CompressionPlugin());

plugins.push(
  new CompressionPlugin({
    algorithm: "brotliCompress",
    filename: "[path][base].br",
    test: /\.(js|css|html|svg)$/,
    threshold: 10240,
    minRatio: 0.8,
  }),
);

plugins.push(
  new RetryChunkLoadPlugin({
    // optional value to set the amount of time in milliseconds before trying to load the chunk again. Default is 0
    retryDelay: 3000,
    // optional value to set the maximum number of retries to load the chunk. Default is 1
    maxRetries: 2,
    // optional code to be executed in the browser context if after all retries chunk is not loaded.
    // if not set - nothing will happen and error will be returned to the chunk loader.
    lastResortScript: "window.location.href='/404.html';",
  }),
);

module.exports = merge(common, {
  webpack: {
    configure: {
      plugins,
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        // Jest module mapper which will detect our absolute imports.
        "^@test(.*)$": "<rootDir>/test$1",
      },
    },
  },
  plugins: [
    // Enable Airgap builds
    {
      plugin: {
        overrideWebpackConfig: ({ context: { env, paths }, webpackConfig }) => {
          if (env.REACT_APP_AIRGAP_ENABLED === "true" || isAirgap === "true") {
            paths.appBuild = webpackConfig.output.path =
              path.resolve("build_airgap");
          }
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
});
