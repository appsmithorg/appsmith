import IconSVG from "../icon.svg";
import type { WidgetTags } from "constants/WidgetConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Paragraph",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.CONTENT] as WidgetTags[],
  searchTags: ["typography", "paragraph", "label"],
};
