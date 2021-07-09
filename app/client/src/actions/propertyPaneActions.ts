import { ReduxActionTypes } from "constants/ReduxActionConstants";
export const updateWidgetName = (widgetId: string, newName: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
    payload: {
      id: widgetId,
      newName,
    },
  };
};

export const hidePropertyPane = () => {
  return {
    type: ReduxActionTypes.HIDE_PROPERTY_PANE,
  };
};

export const bindDataWithWidget = (payload: { widgetId: string }) => {
  return {
    type: ReduxActionTypes.BIND_DATA_WITH_WIDGET,
    payload,
  };
};
