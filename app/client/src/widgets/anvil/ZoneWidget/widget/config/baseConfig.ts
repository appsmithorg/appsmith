import type { WidgetBaseConfiguration } from "WidgetProvider/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const baseConfig: WidgetBaseConfiguration = {
  name: "Zone",
  tags: [WIDGET_TAGS.LAYOUT],
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
  onCanvasUI: {
    selectionBGCSSVar: "--on-canvas-ui-zone-selection",
    focusBGCSSVar: "--on-canvas-ui-zone-focus",
    selectionColorCSSVar: "--on-canvas-ui-zone-focus",
    focusColorCSSVar: "--on-canvas-ui-zone-selection",
    disableParentSelection: false,
  },
};
