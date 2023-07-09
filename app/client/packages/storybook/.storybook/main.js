const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

async function webpackConfig(config) {
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
  stories: [
    "../../design-system/widgets/src/**/*.stories.mdx",
    "../../design-system/headless/src/**/*.stories.mdx",
    "../../design-system/widgets/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../../design-system/widgets-old/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../../design-system/headless/src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app",
    "storybook-addon-pseudo-states",
    "./addons/theming/register.js",
  ],
  framework: "@storybook/react",
  webpackFinal: webpackConfig,
  core: {
    builder: "@storybook/builder-webpack5",
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
};
