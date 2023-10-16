import { AnvilReduxActionTypes } from "./actionTypes";

export const readWidgetPositions = (
  widgetsProcessQueue: {
    [widgetDOMId: string]: DOMRect | boolean;
  },
  layoutsProcessQueue: { [layoutId: string]: DOMRect | boolean },
) => {
  return {
    type: AnvilReduxActionTypes.READ_WIDGET_POSITIONS,
    payload: { widgetsProcessQueue, layoutsProcessQueue },
  };
};
