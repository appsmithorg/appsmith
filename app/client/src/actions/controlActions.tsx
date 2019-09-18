import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";

export const updateWidgetProperty = (
  widgetId: string,
  propertyName: string,
  propertyValue: any,
): ReduxAction<UpdateWidgetPropertyPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
    },
  };
};

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
}
