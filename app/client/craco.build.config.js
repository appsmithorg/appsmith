/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const merge = require("webpack-merge");
const common = require("./craco.common.config.js");

const env = process.env.REACT_APP_ENVIRONMENT;

const plugins = [];

if (env === "PRODUCTION" || env === "STAGING") {
  plugins.push(
    new SentryWebpackPlugin({
      include: "build",
      ignore: ["node_modules", "webpack.config.js"],
      release: process.env.REACT_APP_SENTRY_RELEASE,
    }),
  );
}

module.exports = merge(common, {
  webpack: {
    plugins: plugins,
  },
});
