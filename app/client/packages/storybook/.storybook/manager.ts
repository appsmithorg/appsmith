import { addons } from "@storybook/manager-api";
import appsmithTheme from "./appsmith-theme";

addons.setConfig({
  theme: appsmithTheme,
  selectedPanel: "ds-test",
  enableShortcuts: false,
  sidebar: {
    showRoots: false,
  },
});
