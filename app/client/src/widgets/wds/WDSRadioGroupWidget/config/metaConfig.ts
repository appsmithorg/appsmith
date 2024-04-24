import { WIDGET_TAGS } from "constants/WidgetConstants";
import { RadioGroupIcon, RadioGroupThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Radio Group",
  iconSVG: RadioGroupIcon,
  thumbnailSVG: RadioGroupThumbnail,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["choice"],
};
