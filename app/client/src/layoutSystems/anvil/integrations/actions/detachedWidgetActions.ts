import { AnvilReduxActionTypes } from "./actionTypes";

export const showDetachedWidgetAction = (widgetId: string) => {
  return {
    type: AnvilReduxActionTypes.SHOW_DETACHED_WIDGET,
    payload: widgetId,
  };
};

export const hideDetachedWidgetAction = (widgetId: string) => {
  return {
    type: AnvilReduxActionTypes.HIDE_DETACHED_WIDGET,
    payload: widgetId,
  };
};

export const resetDetachedWidgetsAction = () => {
  return {
    type: AnvilReduxActionTypes.RESET_DETACHED_WIDGETS,
  };
};
