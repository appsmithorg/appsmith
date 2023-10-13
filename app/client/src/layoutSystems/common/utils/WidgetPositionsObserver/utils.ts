export const ANVIL_LAYER = "anvil_layer";
export const ANVIL_WIDGET = "anvil_widget";
export const LAYOUT = "layout";

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
 * @param layoutIndex
 * @returns The ID to be used in the DOM
 */
export const getAnvilLayoutDOMId = (
  canvasId: string,
  layoutId: string,
  layoutIndex: number,
) => {
  return LAYOUT + "_" + canvasId + "_" + layoutId + "_" + layoutIndex;
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
 * Extracts the layoutIndex from the layout DOM Id
 * @param layoutDOMId The id from the DOM nnode
 * @returns layoutIndex
 */
export const extractLayoutIndexFromLayoutDOMId = (layoutDOMId: string) => {
  return parseInt(layoutDOMId.split("_")[3], 10);
};
