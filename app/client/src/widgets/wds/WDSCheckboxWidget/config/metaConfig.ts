import { WIDGET_TAGS } from "constants/WidgetConstants";
import { CheckboxIcon, CheckboxThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Checkbox",
  iconSVG: CheckboxIcon,
  thumbnailSVG: CheckboxThumbnail,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  searchTags: ["boolean"],
};
