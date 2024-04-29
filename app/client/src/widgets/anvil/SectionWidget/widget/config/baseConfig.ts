import { WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";

export const baseConfig: WidgetBaseConfiguration = {
  name: "Section",
  hideCard: true,
  tags: [WIDGET_TAGS.LAYOUT],
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
  onCanvasUI: {
    selectionBGCSSVar: "--ads-section-selection",
    focusBGCSSVar: "--ads-section-focus",
    selectionColorCSSVar: "--ads-section-focus",
    focusColorCSSVar: "--ads-section-selection",
    disableParentSelection: true,
  },
};
