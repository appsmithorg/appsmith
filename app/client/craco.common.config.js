const CracoAlias = require("craco-alias");
const CracoBabelLoader = require("craco-babel-loader");
const path = require("path");

module.exports = {
  devServer: {
    client: {
      webSocketURL: {
        hostname: "127.0.0.1",
        pathname: "/ws",
        port: 3000,
        protocol: "ws",
      },
    },
  },
  webpack: {
    configure: {
      resolve: {
        fallback: {
          assert: false,
          stream: false,
          util: false,
          fs: false,
          os: false,
          path: false,
        },
      },
      module: {
        rules: [
          {
            test: /\.m?js/,
            resolve: { fullySpecified: false },
          },
        ],
      },
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ],
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
      plugin: CracoBabelLoader,
      options: {
        includes: [path.resolve("packages")],
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
