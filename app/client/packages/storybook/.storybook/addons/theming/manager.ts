import { addons, types } from "@storybook/manager-api";
import { ThemingTool } from "./ThemingTool";

addons.register("widgets/theming", () => {
  addons.add("theming-tool", {
    type: types.TOOL,
    title: "Theming tool",
    render: ThemingTool,
    match: (args) => {
      const { viewMode, storyId } = args;

      // show the addon only on wds
      return Boolean(
        (storyId && storyId?.includes("widgets")) ||
          storyId?.includes("testing"),
      );
    },
  });
});
