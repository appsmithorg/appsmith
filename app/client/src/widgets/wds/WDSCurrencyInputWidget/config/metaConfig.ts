import { WIDGET_TAGS } from "constants/WidgetConstants";
import { CurrencyInputIcon, CurrencyInputThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Currency Input",
  iconSVG: CurrencyInputIcon,
  thumbnailSVG: CurrencyInputThumbnail,
  tags: [WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["amount", "total"],
};
