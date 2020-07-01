import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { BatchAction, batchAction } from "actions/batchActions";

export const updateWidgetPropertyRequest = (
  widgetId: string,
  propertyName: string,
  propertyValue: any,
  renderMode: RenderMode,
): ReduxAction<UpdateWidgetPropertyRequestPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
      renderMode,
    },
  };
};

export const updateWidgetProperty = (
  widgetId: string,
  propertyName: string,
  propertyValue: any,
): BatchAction<UpdateWidgetPropertyPayload> => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
    },
  });
};

export const setWidgetDynamicProperty = (
  widgetId: string,
  propertyName: string,
  isDynamic: boolean,
): ReduxAction<SetWidgetDynamicPropertyPayload> => {
  return {
    type: ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
    payload: {
      widgetId,
      propertyName,
      isDynamic,
    },
  };
};

export interface UpdateWidgetPropertyRequestPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
  renderMode: RenderMode;
}

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
}

export interface SetWidgetDynamicPropertyPayload {
  widgetId: string;
  propertyName: string;
  isDynamic: boolean;
}
