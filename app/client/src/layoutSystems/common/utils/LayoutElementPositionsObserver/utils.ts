export const ANVIL_LAYER = "anvil_layer";
export const ANVIL_WIDGET = "anvil_widget";
export const LAYOUT = "layout";

// The following functions are too simple for a unit test to be useful
// The only reason why this would break is if we change how the following
// functions work

/**
 * Method to return Id of widget with widgetId
 * @param widgetId
 * @returns
 */
export const getAnvilWidgetDOMId = (widgetId: string) => {
  return ANVIL_WIDGET + "_" + widgetId;
};

/**
 * Method to return Id of layout with layoutId
 * @param layoutId
 * @param canvasId
 * @returns The ID to be used in the DOM
 */
export const getAnvilLayoutDOMId = (canvasId: string, layoutId: string) => {
  return LAYOUT + "_" + canvasId + "_" + layoutId;
};

/**
 * Extracts the layoutId from the layout DOM Id
 * @param layoutDOMId The id from the DOM nnode
 * @returns layoutId
 */
export const extractLayoutIdFromLayoutDOMId = (layoutDOMId: string) => {
  return layoutDOMId.split("_")[2];
};

/**
 * Extracts the widgetId from the anvil set widget DOM id
 * @param anvilWidgetDOMId The id attribute from the DOM
 * @returns string The widgetId
 */
export function extractWidgetIdFromAnvilWidgetDOMId(anvilWidgetDOMId: string) {
  return anvilWidgetDOMId.split("_")[2];
}
