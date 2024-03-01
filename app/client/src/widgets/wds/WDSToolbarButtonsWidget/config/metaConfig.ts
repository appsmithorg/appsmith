import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Toolbar Buttons",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["click", "submit"],
  tags: [WIDGET_TAGS.BUTTONS],
};
