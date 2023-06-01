import type { AppState } from "@appsmith/reducers";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import type { FlexLayer } from "utils/autoLayout/autoLayoutTypes";

export const AUTO_LAYER = "auto_Layer";
export const AUTO_WIDGET = "auto_widget";
const getFlexLayers = (state: AppState, canvasId: string): FlexLayer[] => {
  const canvasWidgets = getCanvasWidgets(state);

  if (canvasWidgets[canvasId]?.flexLayers) {
    return canvasWidgets[canvasId].flexLayers;
  }

  return [];
};

const getWidgetIdsFromLayers = (flexLayers: FlexLayer[]) => {
  const widgetIds: string[] = [];

  for (const flexLayer of flexLayers) {
    const children = flexLayer.children;
    for (const child of children) {
      widgetIds.push(child.id);
    }
  }

  return widgetIds;
};

export const getAffectedWidgetsFromLayer = (
  state: AppState,
  canvasId: string,
  layerIndex: number,
) => {
  const flexLayers = getFlexLayers(state, canvasId);

  return getWidgetIdsFromLayers(flexLayers.slice(layerIndex));
};

export const getAutoWidgetId = (widgetId: string) => {
  return AUTO_WIDGET + "_" + widgetId;
};

export const getAutoLayerId = (canvasId: string, layerIndex: number) => {
  return AUTO_LAYER + "_" + canvasId + "_" + layerIndex;
};
