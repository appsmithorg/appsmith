import { WIDGET_TAGS } from "constants/WidgetConstants";
import { PhoneInputIcon, PhoneInputThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Phone Input",
  iconSVG: PhoneInputIcon,
  thumbnailSVG: PhoneInputThumbnail,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["call"],
};
