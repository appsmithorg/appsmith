import { addons } from "@storybook/addons";
import appsmithTheme from "./appsmith-theme";

addons.setConfig({
  theme: appsmithTheme,
  selectedPanel: "ds-test",
  sidebar: {
    showRoots: false,
  },
});
