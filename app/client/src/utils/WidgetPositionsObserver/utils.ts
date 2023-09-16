export const AUTO_LAYER = "auto_Layer";
export const AUTO_WIDGET = "auto_widget";
export const LAYOUT = "layout";

/**
 * Method to return Id of widget with widgetId
 * @param widgetId
 * @returns
 */
export const getAutoWidgetId = (widgetId: string) => {
  return AUTO_WIDGET + "_" + widgetId;
};

/**
 * Method to return Id of layer in canvasId of index layerIndex
 * @param canvasId
 * @param layerIndex
 * @returns
 */
export const getAutoLayerId = (canvasId: string, layerIndex: number) => {
  return AUTO_LAYER + "_" + canvasId + "_" + layerIndex;
};

/**
 * Method to return Id of layout with layoutId
 * @param layoutId
 * @returns
 */
export const getLayoutId = (layoutId: string) => {
  return LAYOUT + "_" + layoutId;
};
