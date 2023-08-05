const { merge } = require("webpack-merge");

const common = require("./craco.common.config.js");

module.exports = merge(common, {
  devServer: {
    client: {
      overlay: {
        warnings: false,
        errors: false,
      },
    },
  },
  optimization: {
    minimize: false,
  },
  configure: () => {
    common.config.plugins
      .filter(
        (plugin) => plugin.constructor.name === "ForkTsCheckerWebpackPlugin",
      )
      .forEach((plugin) => {
        plugin.options.typescript = plugin.options.typescript || {};
        plugin.options.typescript.memoryLimit = 4096;
      });

    return common.config;
  },
});
