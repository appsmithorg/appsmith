import type { WidgetBaseConfiguration } from "WidgetProvider/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const baseConfig: WidgetBaseConfiguration = {
  name: "Section",
  hideCard: true,
  tags: [WIDGET_TAGS.LAYOUT],
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
  onCanvasUI: {
    selectionBGCSSVar: "--on-canvas-ui-section-selection",
    focusBGCSSVar: "--on-canvas-ui-section-focus",
    selectionColorCSSVar: "--on-canvas-ui-section-focus",
    focusColorCSSVar: "--on-canvas-ui-section-selection",
    disableParentSelection: true,
  },
};
