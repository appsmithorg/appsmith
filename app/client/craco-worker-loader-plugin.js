const { loaderByName, addAfterLoader } = require("@craco/craco");

module.exports = {
  overrideWebpackConfig: ({
    pluginOptions,
    webpackConfig,
    context: { env },
  }) => {
    const workerLoader = {
      test: /\.worker\.ts$/,
      use: [
        {
          loader: "worker-loader",
          options: pluginOptions || {},
        },
        {
          loader: "babel-loader",
        },
      ],
    };
    debugger;
    addAfterLoader(webpackConfig, loaderByName("babel-loader"), workerLoader);
    return webpackConfig;
  },
};
