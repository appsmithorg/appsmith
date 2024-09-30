import { WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";

export const metaConfig: WidgetBaseConfiguration = {
  name: "AI Chat",
  tags: [WIDGET_TAGS.CONTENT],
  needsMeta: true,
  searchTags: ["chat"],
};
