import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { updateModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import type {
  ModuleId,
  ModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";

export interface ModuleInstancePaneState {
  isRunning: Record<ModuleId, boolean>;
  isSaving: Record<ModuleId, boolean>;
  isDeleting: Record<ModuleId, boolean>;
  isCreating: boolean;
}

const initialState: ModuleInstancePaneState = {
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  isCreating: false,
};

export const handlers = {
  [ReduxActionTypes.CREATE_MODULE_INSTANCE_INIT]: (
    draftState: ModuleInstancePaneState,
  ) => {
    draftState.isCreating = true;
    return draftState;
  },

  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstancePaneState,
  ) => {
    draftState.isCreating = false;
    return draftState;
  },

  [ReduxActionErrorTypes.CREATE_MODULE_INSTANCE_ERROR]: (
    draftState: ModuleInstancePaneState,
  ) => {
    draftState.isCreating = false;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ReturnType<typeof updateModuleInstance>["payload"]>,
  ) => {
    draftState.isSaving[action.payload.id] = true;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    draftState.isSaving[action.payload.id] = false;
    return draftState;
  },

  [ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    draftState.isSaving[action.payload.id] = false;
    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    draftState.isDeleting[action.payload.id] = true;
    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    delete draftState.isDeleting[action.payload.id];
    return draftState;
  },

  [ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    draftState.isDeleting[action.payload.moduleId] = false;
    return draftState;
  },
};

const moduleInstanceReducer = createImmerReducer(initialState, handlers);

export default moduleInstanceReducer;
