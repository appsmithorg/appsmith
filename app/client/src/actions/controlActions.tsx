import type {
  ReduxAction,
  ReduxActionType,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateWidgetsPayload } from "reducers/entityReducers/canvasWidgetsReducer";
import type { DynamicPath } from "utils/DynamicBindingUtils";

export const updateWidgetPropertyRequest = (
  widgetId: string,
  propertyPath: string,
  propertyValue: any,
): ReduxAction<UpdateWidgetPropertyRequestPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyPath,
      propertyValue,
    },
  };
};

export interface BatchPropertyUpdatePayload {
  modify?: Record<string, unknown>; //Key value pairs of paths and values to update
  remove?: string[]; //Array of paths to delete
  triggerPaths?: string[]; // Array of paths in the modify and remove list which are trigger paths
  postUpdateAction?: ReduxActionType; // Array of action types we need to dispatch after propert updates.
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
export const batchUpdateMultipleWidgetProperties = (
  updatesArray: UpdateWidgetPropertyPayload[],
): ReduxAction<{ updatesArray: UpdateWidgetPropertyPayload[] }> => ({
  type: ReduxActionTypes.BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY,
  payload: {
    updatesArray,
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
  shouldRejectDynamicBindingPathList = true,
): ReduxAction<SetWidgetDynamicPropertyPayload> => {
  return {
    type: ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
    payload: {
      widgetId,
      propertyPath,
      isDynamic,
      shouldRejectDynamicBindingPathList,
    },
  };
};

export const updateMultipleWidgetPropertiesAction = (
  widgetsToUpdate: UpdateWidgetsPayload,
  shouldEval = false,
) => {
  return {
    type: ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
    payload: { widgetsToUpdate, shouldEval },
  };
};

export interface UpdateWidgetPropertyRequestPayload {
  widgetId: string;
  propertyPath: string;
  propertyValue: any;
}

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  updates: BatchPropertyUpdatePayload;
  dynamicUpdates?: {
    dynamicBindingPathList?: DynamicPath[];
    dynamicTriggerPathList?: DynamicPath[];
    dynamicPropertyPathList?: DynamicPath[];
  };
  shouldReplay?: boolean;
}

export interface UpdateCanvasLayoutPayload {
  width: number;
  height: number;
  scale: number;
}

export interface SetWidgetDynamicPropertyPayload {
  widgetId: string;
  propertyPath: string;
  isDynamic: boolean;
  shouldRejectDynamicBindingPathList?: boolean;
}

export interface DeleteWidgetPropertyPayload {
  widgetId: string;
  propertyPaths: string[];
}
