import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Statbox",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["statbox"],
  tags: [WIDGET_TAGS.DISPLAY],
};
