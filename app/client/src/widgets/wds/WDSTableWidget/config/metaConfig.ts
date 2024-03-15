import { WIDGET_TAGS } from "constants/WidgetConstants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

export const metaConfig = {
  name: "Table",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.DISPLAY],
  needsMeta: true,
  needsHeightForContent: true,
};
