export const ANVIL_LAYER = "anvil_layer";
export const ANVIL_WIDGET = "anvil_widget";
export const LAYOUT = "layout";

/**
 * Method to return Id of widget with widgetId
 * @param widgetId
 * @returns
 */
export const getAnvilWidgetId = (widgetId: string) => {
  return ANVIL_WIDGET + "_" + widgetId;
};

/**
 * Method to return Id of layer in canvasId of index layerIndex
 * @param canvasId
 * @param layerIndex
 * @returns
 */
export const getAnvilLayerId = (canvasId: string, layerIndex: number) => {
  return ANVIL_LAYER + "_" + canvasId + "_" + layerIndex;
};

/**
 * Method to return Id of layout with layoutId
 * @param layoutId
 * @returns
 */
export const getLayoutId = (canvasId: string, layoutId: string) => {
  return LAYOUT + "_" + canvasId + "_" + layoutId;
};

export const extractLayoutIdFromLayoutDOMId = (layoutDOMId: string) => {
  return layoutDOMId.split("_")[2];
};

export const extractWidgetId = (widgetDOMId: string) => {
  return widgetDOMId.split("_")[2];
};
