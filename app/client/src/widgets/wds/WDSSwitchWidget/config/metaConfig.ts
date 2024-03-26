import IconSVG from "../icon.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Switch",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["boolean"],
};
