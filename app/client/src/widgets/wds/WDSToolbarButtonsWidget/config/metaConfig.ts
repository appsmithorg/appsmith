import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ToolbarButtonsIcon, ToolbarButtonsThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Toolbar Buttons",
  iconSVG: ToolbarButtonsIcon,
  thumbnailSVG: ToolbarButtonsThumbnail,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["click", "submit"],
  tags: [WIDGET_TAGS.BUTTONS],
};
