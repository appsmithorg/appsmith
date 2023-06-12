export const AUTO_LAYER = "auto_Layer";
export const AUTO_WIDGET = "auto_widget";

export const getAutoWidgetId = (widgetId: string) => {
  return AUTO_WIDGET + "_" + widgetId;
};

export const getAutoLayerId = (canvasId: string, layerIndex: number) => {
  return AUTO_LAYER + "_" + canvasId + "_" + layerIndex;
};
