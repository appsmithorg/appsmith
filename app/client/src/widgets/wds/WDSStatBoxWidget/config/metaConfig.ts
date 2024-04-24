import { WIDGET_TAGS } from "constants/WidgetConstants";
import { StatsBoxIcon, StatsBoxThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Statbox",
  iconSVG: StatsBoxIcon,
  thumbnailSVG: StatsBoxThumbnail,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["statbox"],
  tags: [WIDGET_TAGS.DISPLAY],
};
