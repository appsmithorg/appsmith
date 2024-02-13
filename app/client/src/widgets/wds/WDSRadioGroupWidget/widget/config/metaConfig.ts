import { WIDGET_TAGS } from "constants/WidgetConstants";

import IconSVG from "../../icon.svg";
import ThumbnailSVG from "../../thumbnail.svg";

export const metaConfig = {
  name: "Radio Group",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["choice"],
};
