const CracoAlias = require("craco-alias");
const { addBeforeLoader, loaderByName } = require("@craco/craco");

const config = {
  webpack: {
    configure: function(webpackConfig) {
      const fragLoader = {
        test: /\.worker\.(c|m)?[tj]s$/i,
        loader: "worker-loader",
        options: {
          filename: "[name].[contenthash].worker.js",
        },
      };

      addBeforeLoader(webpackConfig, loaderByName("file-loader"), fragLoader);

      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: "./src",
        // tsConfigPath should point to the file where "baseUrl" and "paths" are specified
        tsConfigPath: "./tsconfig.path.json",
      },
    },
    {
      plugin: "prismjs",
      options: {
        languages: ["javascript"],
        plugins: [],
        theme: "twilight",
        css: false,
      },
    },
  ],
};

module.exports = config;
