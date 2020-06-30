import { ReduxActionTypes } from "constants/ReduxActionConstants";
export const updateWidgetName = (widgetId: string, newName: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
    payload: {
      widgetId,
      newName,
    },
  };
};
