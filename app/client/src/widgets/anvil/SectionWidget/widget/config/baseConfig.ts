import { WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";
import IconSVG from "../../icon.svg";

export const baseConfig: WidgetBaseConfiguration = {
  name: "Section",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.LAYOUT],
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
};
