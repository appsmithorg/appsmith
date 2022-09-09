const { merge } = require("webpack-merge");
const common = require("./craco.common.config.js");
module.exports = merge(common, {
  babel: {
    plugins: ["babel-plugin-styled-components"],
  },
  optimization: {
    minimize: false,
  },
});
