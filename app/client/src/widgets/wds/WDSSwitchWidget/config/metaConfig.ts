import { WIDGET_TAGS } from "constants/WidgetConstants";
import { SwitchIcon, SwitchThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Switch",
  iconSVG: SwitchIcon,
  thumbnailSVG: SwitchThumbnail,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["boolean"],
};
