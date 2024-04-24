import { WIDGET_TAGS } from "constants/WidgetConstants";
import { InlineButtonsIcon, InlineButtonsThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Inline Buttons",
  iconSVG: InlineButtonsIcon,
  thumbnailSVG: InlineButtonsThumbnail,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["click", "submit"],
  tags: [WIDGET_TAGS.BUTTONS],
};
