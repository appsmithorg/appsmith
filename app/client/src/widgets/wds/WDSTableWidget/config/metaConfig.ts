import { WIDGET_TAGS } from "constants/WidgetConstants";
import { TableIcon, TableThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Table",
  iconSVG: TableIcon,
  thumbnailSVG: TableThumbnail,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.DISPLAY],
  needsMeta: true,
  needsHeightForContent: true,
};
