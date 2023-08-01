import { addons, types } from "@storybook/manager-api";
import { ThemingPanel } from "./ThemingPanel";

// Register the addon
addons.register("widgets/theming", () => {
  // Register the tool
  addons.add("widgets-addon/panel", {
    type: types.PANEL,
    title: "Theming",
    match: (args) => {
      const { viewMode, storyId } = args;

      // show the addon only on wds
      return !!(
        storyId &&
        storyId?.includes("widgets") &&
        !storyId?.includes("widgets-old") &&
        !!(viewMode && viewMode.match(/^(story|docs)$/))
      );
    },
    render: ThemingPanel,
  });
});
