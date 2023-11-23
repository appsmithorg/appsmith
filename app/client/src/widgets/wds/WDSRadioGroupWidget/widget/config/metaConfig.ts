import { WIDGET_TAGS } from "constants/WidgetConstants";

import IconSVG from "../../icon.svg";

export const metaConfig = {
  name: "Radio Group",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["choice"],
};
