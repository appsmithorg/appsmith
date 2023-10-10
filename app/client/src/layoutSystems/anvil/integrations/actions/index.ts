import { AnvilReduxActionTypes } from "./actionTypes";

export const readWidgetPositions = (
  widgetsProcessQueue: {
    [widgetDOMId: string]: boolean;
  },
  layersProcessQueue: { [canvasId: string]: number },
  layoutsProcessQueue: { [layoutId: string]: boolean },
) => {
  return {
    type: AnvilReduxActionTypes.READ_WIDGET_POSITIONS,
    payload: { widgetsProcessQueue, layersProcessQueue, layoutsProcessQueue },
  };
};
