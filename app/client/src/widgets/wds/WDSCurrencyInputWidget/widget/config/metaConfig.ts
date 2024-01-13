import { WIDGET_TAGS } from "constants/WidgetConstants";

import IconSVG from "../../icon.svg";

export const metaConfig = {
  name: "Currency Input",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["amount", "total"],
};
