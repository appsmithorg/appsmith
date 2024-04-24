import { WIDGET_TAGS } from "constants/WidgetConstants";
import { SwitchGroupIcon, SwitchGroupThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Switch Group",
  iconSVG: SwitchGroupIcon,
  thumbnailSVG: SwitchGroupThumbnail,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
};
