import { mergeConfig } from "vite";
import svgr from "vite-plugin-svgr";

function getStories() {
  if (process.env.CHROMATIC) {
    return ["../chromatic/**/*.chromatic.stories.@(js|jsx|ts|tsx)"];
  }

  return [
    "../../design-system/**/docs/**/*.stories.mdx",
    "./../design-system/**/docs/**/*.stories.@(js|jsx|ts|tsx)",
  ];
}

module.exports = {
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      define: { "process.env": {} },
      plugins: [svgr()],
    });
  },
  stories: getStories(),
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-viewport",
    "@storybook/addon-docs",
    "@storybook/addon-actions",
    "@storybook/addon-controls",
    "@storybook/addon-toolbars",
    "@storybook/addon-measure",
    "@storybook/addon-outline",
    "@storybook/preset-create-react-app",
    "./addons/theming/manager.ts",
  ],
  framework: {
    name: "@storybook/react-vite",
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
  core: {
    disableTelemetry: true,
  },
};
