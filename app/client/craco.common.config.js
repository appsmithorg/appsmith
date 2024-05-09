const CracoAlias = require("craco-alias");
const CracoBabelLoader = require("craco-babel-loader");
const path = require("path");
const webpack = require("webpack");
const WorkboxPlugin = require("workbox-webpack-plugin");

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
  babel: {
    plugins: ["babel-plugin-lodash"],
  },
  eslint: {
    enable: false,
  },
  typescript: {
    enableTypeChecking: process.env.ENABLE_TYPE_CHECKING !== "false",
  },
  webpack: {
    configure: {
      resolve: {
        alias: {
          "lodash-es": "lodash",
        },
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
          {
            test: /\.module\.css$/,
            use: [
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    plugins: [
                      "postcss-nesting",
                      "postcss-import",
                      "postcss-at-rules-variables",
                      "postcss-each",
                      "postcss-url",
                      "postcss-modules-values",
                      [
                        "cssnano",
                        {
                          preset: ["default"],
                        },
                      ],
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
      optimization: {
        splitChunks: {
          cacheGroups: {
            icons: {
              // This determines which modules are considered icons
              test: (module) => {
                const modulePath = module.resource;
                if (!modulePath) return false;

                return (
                  modulePath.match(/node_modules[\\\/]remixicon-react[\\\/]/) ||
                  modulePath.endsWith(".svg.js") ||
                  modulePath.endsWith(".svg")
                );
              },
              // This determines which chunk to put the icon into.
              //
              // Why have three separate cache groups for three different kinds of
              // icons? Purely as an optimization: not every page needs all icons,
              // so we can avoid loading unused icons sometimes.
              name: (module) => {
                if (
                  module.resource?.match(
                    /node_modules[\\\/]remixicon-react[\\\/]/,
                  )
                ) {
                  return "remix-icons";
                }

                if (module.resource?.includes("blueprint")) {
                  return "blueprint-icons";
                }

                return "svg-icons";
              },
              // This specifies that only icons from import()ed chunks should be moved
              chunks: "async",
              // This makes webpack ignore the minimum chunk size requirement
              enforce: true,
            },
          },
        },
      },
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            (warning.module?.resource.includes("node_modules") &&
              warning.details?.includes("source-map-loader")) ??
            false
          );
        },
        function ignorePackageWarnings(warning) {
          return (
            warning.module?.resource.includes(
              "/node_modules/@babel/standalone/babel.js",
            ) ||
            warning.module?.resource.includes("/node_modules/sass/sass.dart.js")
          );
        },
      ],
      plugins: [
        // Replace BlueprintJS’s icon component with our own implementation
        // that code-splits icons away
        new webpack.NormalModuleReplacementPlugin(
          /@blueprintjs\/core\/lib\/\w+\/components\/icon\/icon\.\w+/,
          require.resolve(
            "./src/components/designSystems/blueprintjs/icon/index.js",
          ),
        ),
        new WorkboxPlugin.InjectManifest({
          swSrc: "./src/serviceWorker.js",
          mode: "development",
          swDest: "./pageService.js",
          maximumFileSizeToCacheInBytes: 11 * 1024 * 1024,
          exclude: [
            // Don’t cache source maps and PWA manifests.
            // (These are the default values of the `exclude` option: https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-WebpackPartial,
            // so we need to specify them explicitly if we’re extending this array.)
            /\.map$/,
            /^manifest.*\.js$/,
            // Don’t cache the root html file
            /index\.html/,
            // Don’t cache LICENSE.txt files emitted by CRA
            // when a chunk includes some license comments
            /LICENSE\.txt/,
            // Don’t cache static icons as there are hundreds of them, and caching them all
            // one by one (as the service worker does it) keeps the network busy for a long time
            // and delays the service worker installation
            /\/*\.svg$/,
          ],
          // Don’t cache-bust JS and CSS chunks
          dontCacheBustURLsMatching: /\.[0-9a-zA-Z]{8}\.chunk\.(js|css)$/,
        }),
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

    {
      // Prioritize the local src directory over node_modules.
      // This matters for cases where `src/<dirname>` and `node_modules/<dirname>` both exist –
      // e.g., when `<dirname>` is `entities`: https://github.com/appsmithorg/appsmith/pull/20964#discussion_r1124782356
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          webpackConfig.resolve.modules = [
            path.resolve(__dirname, "src"),
            ...webpackConfig.resolve.modules,
          ];
          return webpackConfig;
        },
      },
    },
  ],
};
