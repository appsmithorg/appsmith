import { isAirgapped } from "ee/utils/airgapHelpers";
import { WIDGET_TAGS } from "constants/WidgetConstants";

import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

export const metaConfig = {
  name: "Custom",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  needsMeta: true,
  isCanvas: false,
  tags: [WIDGET_TAGS.DISPLAY],
  searchTags: ["external"],
  isSearchWildcard: true,
  hideCard: isAirgapped(),
};
