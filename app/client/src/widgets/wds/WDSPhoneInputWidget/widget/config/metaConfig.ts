import { WIDGET_TAGS } from "constants/WidgetConstants";

import IconSVG from "../../icon.svg";
import ThumbnailSVG from "../../thumbnail.svg";

export const metaConfig = {
  name: "Phone Input",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["call"],
};
