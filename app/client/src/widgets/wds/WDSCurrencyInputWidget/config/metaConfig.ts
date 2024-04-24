import { WIDGET_TAGS } from "constants/WidgetConstants";
import { InputCurrencyIcon, InputCurrencyThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Currency Input",
  iconSVG: InputCurrencyIcon,
  thumbnailSVG: InputCurrencyThumbnail,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["amount", "total"],
};
