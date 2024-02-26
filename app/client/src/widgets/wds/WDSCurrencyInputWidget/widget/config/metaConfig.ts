import { WIDGET_TAGS } from "constants/WidgetConstants";

import ThumbnailSVG from "../../thumbnail.svg";
import IconSVG from "../../icon.svg";

export const metaConfig = {
  name: "Currency Input",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["amount", "total"],
};
