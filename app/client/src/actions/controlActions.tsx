import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { BatchAction, batchAction } from "actions/batchActions";
import { DynamicPath } from "utils/DynamicBindingUtils";

export const updateWidgetPropertyRequest = (
  widgetId: string,
  propertyPath: string,
  propertyValue: any,
  renderMode: RenderMode,
): ReduxAction<UpdateWidgetPropertyRequestPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyPath,
      propertyValue,
      renderMode,
    },
  };
};

export const updateWidgetProperty = (
  widgetId: string,
  updates: Record<string, unknown>,
  dynamicUpdates?: {
    dynamicBindingPathList: DynamicPath[];
    dynamicTriggerPathList: DynamicPath[];
  },
): BatchAction<UpdateWidgetPropertyPayload> => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: {
      widgetId,
      updates,
      dynamicUpdates,
    },
  });
};

export interface BatchPropertyUpdatePayload {
  modify?: Record<string, unknown>; //Key value pairs of paths and values to update
  remove?: string[]; //Array of paths to delete
}

export const batchUpdateWidgetProperty = (
  widgetId: string,
  updates: BatchPropertyUpdatePayload,
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
}

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  updates: BatchPropertyUpdatePayload;
  dynamicUpdates?: {
    dynamicBindingPathList: DynamicPath[];
    dynamicTriggerPathList: DynamicPath[];
  };
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
