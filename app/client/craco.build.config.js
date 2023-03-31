/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./craco.common.config.js");
const WorkboxPlugin = require("workbox-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

const env = process.env.REACT_APP_ENVIRONMENT;

const plugins = [];

plugins.push(
  new WorkboxPlugin.InjectManifest({
    swSrc: "./src/serviceWorker.js",
    mode: "development",
    swDest: "./pageService.js",
    maximumFileSizeToCacheInBytes: 11 * 1024 * 1024,
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
    plugins: plugins,
  },
  jest: {
    configure: {
      moduleNameMapper: {
        // Jest module mapper which will detect our absolute imports.
        "^@test(.*)$": "<rootDir>/test$1",
      },
    },
  },
});
