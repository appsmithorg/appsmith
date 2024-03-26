import { WIDGET_TAGS } from "constants/WidgetConstants";
import IconSVG from "../icon.svg";

export const metaConfig = {
  name: "Modal",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.LAYOUT],
  needsMeta: true,
  searchTags: ["dialog", "popup", "notification"],
};
