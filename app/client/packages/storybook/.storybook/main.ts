import { mergeConfig } from "vite";
import svgr from "vite-plugin-svgr";
import postcssNesting from "postcss-nesting";
import postcssImport from "postcss-import";
import postcssAtRulesVariables from "postcss-at-rules-variables";
import postcssEach from "postcss-each";
import postcssModulesValues from "postcss-modules-values";
import * as glob from "glob";
import * as path from "path";

const dsDir = path.resolve(__dirname, "../../design-system");

function getStories() {
  if (process.env.CHROMATIC) {
    return ["../../design-system/**/*.chromatic.stories.@(js|jsx|ts|tsx)"];
  }

  return glob
    .sync(`${dsDir}/**/*.stories.@(js|jsx|ts|tsx|mdx)`, { nosort: true })
    .filter((storyPath) => !storyPath.includes("chromatic"));
}

module.exports = {
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      define: { "process.env": {} },
      plugins: [svgr()],
      css: {
        postcss: {
          plugins: [
            postcssNesting,
            postcssImport,
            postcssAtRulesVariables,
            postcssEach,
            postcssModulesValues,
          ],
        },
      },
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
