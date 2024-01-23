import { AnvilReduxActionTypes } from "./actionTypes";

export const readLayoutElementPositions = () => {
  return {
    type: AnvilReduxActionTypes.READ_LAYOUT_ELEMENT_POSITIONS,
  };
};

export const deleteLayoutElementPositions = (elements: string[]) => {
  return {
    type: AnvilReduxActionTypes.REMOVE_LAYOUT_ELEMENT_POSITIONS,
    payload: elements,
  };
};

export const selectAnvilWidget = (widgetId: string, evt: PointerEvent) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_WIDGET_SELECTION_CLICK,
    payload: {
      widgetId: widgetId,
      e: evt,
    },
  };
};
