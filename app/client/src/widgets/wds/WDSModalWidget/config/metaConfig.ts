import { WIDGET_TAGS } from "constants/WidgetConstants";

export const metaConfig = {
  name: "Modal",
  tags: [WIDGET_TAGS.LAYOUT],
  needsMeta: true,
  searchTags: ["dialog", "popup", "modal", "window"],
  onCanvasUI: {
    selectionBGCSSVar: "--on-canvas-ui-widget-selection",
    focusBGCSSVar: "--on-canvas-ui-widget-focus",
    selectionColorCSSVar: "--on-canvas-ui-widget-focus",
    focusColorCSSVar: "--on-canvas-ui-widget-selection",
    disableParentSelection: true,
  },
};
