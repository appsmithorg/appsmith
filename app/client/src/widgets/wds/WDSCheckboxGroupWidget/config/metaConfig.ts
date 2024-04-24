import { WIDGET_TAGS } from "constants/WidgetConstants";
import { CheckboxGroupIcon, CheckboxGroupThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Checkbox Group",
  iconSVG: CheckboxGroupIcon,
  thumbnailSVG: CheckboxGroupThumbnail,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
};
