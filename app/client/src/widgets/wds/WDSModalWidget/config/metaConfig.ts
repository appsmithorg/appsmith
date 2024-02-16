import { WIDGET_TAGS } from "constants/WidgetConstants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

export const metaConfig = {
  name: "Modal",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.LAYOUT],
  needsMeta: true,
  searchTags: ["dialog", "popup", "notification"],
};
