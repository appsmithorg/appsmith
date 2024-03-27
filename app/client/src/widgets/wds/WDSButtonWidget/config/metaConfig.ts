import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Button",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  needsMeta: false,
  isCanvas: false,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.BUTTONS],
  searchTags: ["click", "submit"],
};
