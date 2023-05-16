const { merge } = require("webpack-merge");

const common = require("./craco.common.config.js");

module.exports = merge(common, {
  optimization: {
    minimize: false,
  },
  babel: {
    plugins: ["babel-plugin-styled-components"],
  },
});
