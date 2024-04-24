import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ButtonIcon, ButtonThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Button",
  iconSVG: ButtonIcon,
  thumbnailSVG: ButtonThumbnail,
  needsMeta: false,
  isCanvas: false,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.BUTTONS],
  searchTags: ["click", "submit"],
};
