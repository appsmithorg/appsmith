import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { DynamicPath } from "utils/DynamicBindingUtils";

export const updateWidgetPropertyRequest = (
  widgetId: string,
  propertyPath: string,
  propertyValue: any,
  renderMode: RenderMode,
  shouldReplay = true,
): ReduxAction<UpdateWidgetPropertyRequestPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyPath,
      propertyValue,
      renderMode,
      shouldReplay,
    },
  };
};

export interface BatchPropertyUpdatePayload {
  modify?: Record<string, unknown>; //Key value pairs of paths and values to update
  remove?: string[]; //Array of paths to delete
  triggerPaths?: string[]; // Array of paths in the modify and remove list which are trigger paths
}

export const batchUpdateWidgetProperty = (
  widgetId: string,
  updates: BatchPropertyUpdatePayload,
  shouldReplay = true,
): ReduxAction<UpdateWidgetPropertyPayload> => ({
  type: ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
  payload: {
    widgetId,
    updates,
    shouldReplay,
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
  shouldReplay: boolean;
}

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  updates: BatchPropertyUpdatePayload;
  shouldReplay: boolean;
  dynamicUpdates?: {
    dynamicBindingPathList: DynamicPath[];
    dynamicTriggerPathList: DynamicPath[];
  };
}

export interface UpdateCanvasLayout {
  width: number;
  height: number;
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
