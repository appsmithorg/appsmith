/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const merge = require("webpack-merge");
const common = require("./craco.common.config.js");
const WorkboxPlugin = require("workbox-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require("brotli-webpack-plugin");

const env = process.env.REACT_APP_ENVIRONMENT;

const plugins = [];

plugins.push(
  new WorkboxPlugin.InjectManifest({
    swSrc: "./src/serviceWorker.js",
    mode: "development",
    swDest: "./pageService.js",
    maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
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
  new BrotliPlugin({
    asset: "[path].br[query]",
    test: /\.(js|css|html|svg)$/,
    threshold: 10240,
    minRatio: 0.8,
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
