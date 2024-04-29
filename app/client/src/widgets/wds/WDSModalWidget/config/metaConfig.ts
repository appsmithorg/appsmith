import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Modal",
  tags: [WIDGET_TAGS.LAYOUT],
  needsMeta: true,
  searchTags: ["dialog", "popup", "notification"],
  onCanvasUI: {
    selectionBGCSSVar: "--ads-widget-selection",
    focusBGCSSVar: "--ads-widget-focus",
    selectionColorCSSVar: "--ads-widget-focus",
    focusColorCSSVar: "--ads-widget-selection",
    disableParentSelection: true,
  },
};
