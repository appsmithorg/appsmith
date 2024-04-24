import { WIDGET_TAGS } from "constants/WidgetConstants";
import { InputIcon, InputThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Input",
  iconSVG: InputIcon,
  thumbnailSVG: InputThumbnail,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["form", "text input", "number", "textarea"],
};
