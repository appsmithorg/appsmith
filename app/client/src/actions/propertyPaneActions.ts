import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
export const updateWidgetName = (widgetId: string, newName: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
    payload: {
      id: widgetId,
      newName,
    },
  };
};

export const bindDataToWidget = (payload: { widgetId: string }) => {
  return {
    type: ReduxActionTypes.BIND_DATA_TO_WIDGET,
    payload,
  };
};

export const setSnipingMode = (payload: boolean) => ({
  type: ReduxActionTypes.SET_SNIPING_MODE,
  payload,
});

export const resetSnipingMode = () => ({
  type: ReduxActionTypes.RESET_SNIPING_MODE,
});
