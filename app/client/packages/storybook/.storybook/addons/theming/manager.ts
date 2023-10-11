import { addons, types } from "@storybook/manager-api";
import { ThemingTool } from "./ThemingTool";

addons.register("widgets/theming", () => {
  addons.add("theming-tool", {
    type: types.TOOL,
    title: "Theming tool",
    render: ThemingTool,
  });
});
