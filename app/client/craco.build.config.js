/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const merge = require("webpack-merge");
const common = require("./craco.common.config.js");
const WorkboxPlugin = require("workbox-webpack-plugin");

const env = process.env.REACT_APP_ENVIRONMENT;

const plugins = [];

plugins.push(
  new WorkboxPlugin.InjectManifest({
    swSrc: "./src/serviceWorker.js",
    mode: "development",
    swDest: "./pageService.js",
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  }),
);

if (env === "PRODUCTION" || env === "STAGING") {
  plugins.push(
    new SentryWebpackPlugin({
      include: "build",
      ignore: ["node_modules", "webpack.config.js"],
      setCommits: {
        auto: true
      },
      deploy: {
        env: process.env.REACT_APP_SENTRY_ENVIRONMENT
      }
    }),
  );
}

module.exports = merge(common, {
  webpack: {
    plugins: plugins,
  },
});
