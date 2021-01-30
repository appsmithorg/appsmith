import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { BatchAction, batchAction } from "actions/batchActions";

export const updateWidgetPropertyRequest = (
  widgetId: string,
  propertyPath: string,
  propertyValue: any,
  renderMode: RenderMode,
  isDynamicTrigger?: boolean,
): ReduxAction<UpdateWidgetPropertyRequestPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyPath,
      propertyValue,
      renderMode,
      isDynamicTrigger,
    },
  };
};

export const updateWidgetProperty = (
  widgetId: string,
  updates: Record<string, unknown>,
): BatchAction<UpdateWidgetPropertyPayload> => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: {
      widgetId,
      updates,
    },
  });
};

export const batchUpdateWidgetProperty = (
  widgetId: string,
  updates: Record<string, unknown>,
): ReduxAction<UpdateWidgetPropertyPayload> => ({
  type: ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
  payload: {
    widgetId,
    updates,
  },
});

export const deleteWidgetProperty = (
  widgetId: string,
  propertyPaths: string[],
): ReduxAction<DeleteWidgetPropertyPayload> => ({
  type: ReduxActionTypes.DELETE_WIDGET_PROPERTY,
  payload: {
    widgetId,
    propertyPaths,
  },
});

export const setWidgetDynamicProperty = (
  widgetId: string,
  propertyPath: string,
  isDynamic: boolean,
): ReduxAction<SetWidgetDynamicPropertyPayload> => {
  return {
    type: ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
    payload: {
      widgetId,
      propertyPath,
      isDynamic,
    },
  };
};

export interface UpdateWidgetPropertyRequestPayload {
  widgetId: string;
  propertyPath: string;
  propertyValue: any;
  renderMode: RenderMode;
  isDynamicTrigger?: boolean;
}

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  updates: Record<string, unknown>;
}

export interface SetWidgetDynamicPropertyPayload {
  widgetId: string;
  propertyPath: string;
  isDynamic: boolean;
}

export interface DeleteWidgetPropertyPayload {
  widgetId: string;
  propertyPaths: string[];
}
