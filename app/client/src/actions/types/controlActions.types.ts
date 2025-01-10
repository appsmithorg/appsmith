import type {
  ReduxAction,
  ReduxActionType,
} from "ee/constants/ReduxActionConstants";
import type { DynamicPath } from "utils/DynamicBindingUtils";

export interface BatchPropertyUpdatePayload {
  modify?: Record<string, unknown>; //Key value pairs of paths and values to update
  remove?: string[]; //Array of paths to delete
  triggerPaths?: string[]; // Array of paths in the modify and remove list which are trigger paths
  postUpdateAction?: ReduxActionType; // Array of action types we need to dispatch after property updates.
}

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
}

export interface SetWidgetDynamicPropertyPayload {
  widgetId: string;
  propertyPath: string;
  isDynamic: boolean;
  shouldRejectDynamicBindingPathList?: boolean;
  skipValidation?: boolean;
}

export type BatchUpdateDynamicPropertyUpdates = Omit<
  SetWidgetDynamicPropertyPayload,
  "widgetId"
>;

export interface BatchUpdateWidgetDynamicPropertyPayload {
  widgetId: string;
  updates: BatchUpdateDynamicPropertyUpdates[];
}

export interface DeleteWidgetPropertyPayload {
  widgetId: string;
  propertyPaths: string[];
}
