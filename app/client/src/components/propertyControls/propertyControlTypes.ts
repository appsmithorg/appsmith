import type { ReduxActionType } from "@appsmith/constants/ReduxActionConstants";

export interface BatchPropertyUpdatePayload {
  modify?: Record<string, unknown>; //Key value pairs of paths and values to update
  remove?: string[]; //Array of paths to delete
  triggerPaths?: string[]; // Array of paths in the modify and remove list which are trigger paths
  postUpdateAction?: ReduxActionType; // Array of action types we need to dispatch after property updates.
}
