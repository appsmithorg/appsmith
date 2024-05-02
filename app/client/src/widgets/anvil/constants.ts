export const anvilWidgets = {
  SECTION_WIDGET: "SECTION_WIDGET",
  ZONE_WIDGET: "ZONE_WIDGET",
};

export enum Elevations {
  SECTION_ELEVATION = 1,
  ZONE_ELEVATION = 2,
}

/**
 * The default values that will be applied to all widgets.
 * This is the default for the API that allows widgets to define their selection and focus colors.
 */
export const DEFAULT_WIDGET_ON_CANVAS_UI = {
  selectionBGCSSVar: "--on-canvas-ui-widget-selection",
  focusBGCSSVar: "--on-canvas-ui-widget-focus",
  selectionColorCSSVar: "--on-canvas-ui-widget-focus",
  focusColorCSSVar: "--on-canvas-ui-widget-selection",
  disableParentSelection: false,
};
