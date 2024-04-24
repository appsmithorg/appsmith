import type { WidgetTags } from "constants/WidgetConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ParagraphIcon, ParagraphThumbnail } from "appsmith-icons";

export const metaConfig = {
  name: "Paragraph",
  iconSVG: ParagraphIcon,
  thumbnailSVG: ParagraphThumbnail,
  tags: [WIDGET_TAGS.CONTENT] as WidgetTags[],
  searchTags: ["typography", "paragraph", "label"],
};
