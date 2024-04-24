import { WIDGET_TAGS } from "constants/WidgetConstants";
import { InputPhoneIcon, InputPhoneThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Phone Input",
  iconSVG: InputPhoneIcon,
  thumbnailSVG: InputPhoneThumbnail,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["call"],
};
