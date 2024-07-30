import type { StorybookConfig } from "@storybook/react-vite";
import * as glob from "glob";
import * as path from "path";

const dsDir = path.resolve(__dirname, "../../design-system");

function getStories() {
  if (process.env.CHROMATIC) {
    return ["../../design-system/**/*.chromatic.stories.@(ts|tsx)"];
  }

  const tsStories = glob
    .sync(`${dsDir}/**/*.stories.@(ts|tsx)`, { nosort: true })
    .filter((storyPath) => !storyPath.includes("chromatic"));

  return ["../../design-system/**/*.mdx", "../../icons/**/*.mdx", ...tsStories];
}

const config: StorybookConfig = {
  stories: getStories(),

  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-viewport",
    "@storybook/addon-docs",
    "@storybook/addon-controls",
    "@storybook/addon-toolbars",
    "@storybook/addon-measure",
    "@storybook/addon-outline",
    "@storybook/preset-create-react-app",
    "./addons/theming/manager.ts",
  ],

  framework: "@storybook/react-vite",

  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      propFilter: (prop) =>
        prop.parent ? !/node_modules\*/.test(prop.parent.fileName) : true,
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },

  // in order ADS images to load correctly
  staticDirs: ["../../design-system/ads/src/__assets__"],

  core: {
    disableTelemetry: true,
  },

  docs: {},
};

export default config;
