import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ModalThumbnail, ModalIcon } from "appsmith-icons";

export const metaConfig = {
  name: "Modal",
  iconSVG: ModalIcon,
  thumbnailSVG: ModalThumbnail,
  tags: [WIDGET_TAGS.LAYOUT],
  needsMeta: true,
  searchTags: ["dialog", "popup", "notification"],
};
