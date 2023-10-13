import { AnvilReduxActionTypes } from "./actionTypes";

export const readLayoutElementPositions = (
  widgetsProcessQueue: {
    [widgetDOMId: string]: boolean;
  },
  layoutsProcessQueue: { [layoutId: string]: boolean },
) => {
  return {
    type: AnvilReduxActionTypes.READ_LAYOUT_ELEMENT_POSITIONS,
    payload: { widgetsProcessQueue, layoutsProcessQueue },
  };
};
