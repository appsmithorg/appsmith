const merge = require("webpack-merge");
const common = require("./craco.common.config.js");
module.exports = merge(common, {
  babel: {
    plugins: ["babel-plugin-styled-components", "istanbul"],
  },
  optimization: {
    minimize: false,
  },
});
