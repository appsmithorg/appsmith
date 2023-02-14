const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

async function webpackConfig(config) {
  config.module.rules.find(
    (rule) => rule.test.toString() === "/\\.css$/",
  ).exclude = /\.module\.css$/;

  config.module.rules.push({
    test: /\.module\.css$/,
    use: [
      "style-loader",
      {
        loader: "css-loader",
        options: {
          modules: true,
        },
      },
    ],
  });

  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx)$/,
    use: {
      loader: "babel-loader",
      options: {
        presets: [
          "@babel/preset-env",
          "@babel/preset-react",
          "@babel/preset-typescript",
        ],
      },
    },
  });

  config.resolve.plugins.push(new TsconfigPathsPlugin());

  return config;
}

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-color-picker",
    {
      name: "@storybook/addon-postcss",
      options: {
        postcssLoaderOptions: {
          implementation: require("postcss"),
        },
      },
    },
    "storybook-zeplin/register",
  ],
  framework: "@storybook/react",
  webpackFinal: webpackConfig,
  babel: async (options) => {
    options.plugins.push([
      "babel-plugin-inline-react-svg",
      {
        svgo: {
          plugins: [
            {
              name: "removeViewBox",
              active: false,
            },
          ],
        },
      },
    ]);
    return options;
  },
};
