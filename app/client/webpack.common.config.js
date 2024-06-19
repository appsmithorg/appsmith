// const CracoAlias = require("craco-alias");
// const CracoBabelLoader = require("craco-babel-loader");
const path = require("path");
const webpack = require("webpack");

const alias = require("./tsconfig.path-alias");
console.log(alias);
// exit;

module.exports = {
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
  },

  //   babel: {
  //     plugins: ["babel-plugin-lodash"],
  //   },
  // eslint: {
  //   enable: false,
  // },
  // typescript: {
  //   enableTypeChecking: process.env.ENABLE_TYPE_CHECKING !== "false",
  // },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    alias: {
      // ...alias,
      "@appsmith": "/Users/alexg/Node/appsmith/app/client/src/ee",
      test: "/Users/alexg/Node/appsmith/app/test",
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
        test: /\.less$/i,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg|json\.txt)$/i,
        type: "asset/resource",
      },
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          // loader: "swc-loader",
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
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
              module.resource?.match(/node_modules[\\\/]remixicon-react[\\\/]/)
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
  ],
  // plugins: [

  //   {
  //     plugin: "prismjs",
  //     options: {
  //       languages: ["javascript"],
  //       plugins: [],
  //       theme: "twilight",
  //       css: false,
  //     },
  //   },
  //   {
  //     // Prioritize the local src directory over node_modules.
  //     // This matters for cases where `src/<dirname>` and `node_modules/<dirname>` both exist –
  //     // e.g., when `<dirname>` is `entities`: https://github.com/appsmithorg/appsmith/pull/20964#discussion_r1124782356
  //     plugin: {
  //       overrideWebpackConfig: ({ webpackConfig }) => {
  //         webpackConfig.resolve.modules = [
  //           path.resolve(__dirname, "src"),
  //           ...webpackConfig.resolve.modules,
  //         ];
  //         return webpackConfig;
  //       },
  //     },
  //   },
  // ],
};
