import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { UpdateModuleInstanceSettingsPayload } from "@appsmith/actions/moduleInstanceActions";
import type { Action } from "entities/Action";

export interface ModuleInstancePaneState {
  nameSavingStatus: Record<string, { isSaving: boolean; error: boolean }>;
  settingsSavingStatus: Record<string, { isSaving: boolean; error: boolean }>;
  deletingStatus: Record<string, { isDeleting: boolean; error: boolean }>;
}

export const initialState: ModuleInstancePaneState = {
  nameSavingStatus: {},
  settingsSavingStatus: {},
  deletingStatus: {},
};

export const handlers = {
  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.nameSavingStatus[action.payload.id] = {
      isSaving: true,
      error: false,
    };
    return draftState;
  },

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.nameSavingStatus[action.payload.id].isSaving = false;
    draftState.nameSavingStatus[action.payload.id].error = false;
    return draftState;
  },

  [ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.nameSavingStatus[action.payload.id].isSaving = false;
    draftState.nameSavingStatus[action.payload.id].error = true;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<UpdateModuleInstanceSettingsPayload>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id] = {
      isSaving: true,
      error: false,
    };
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<Action>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id].isSaving = false;
    draftState.settingsSavingStatus[action.payload.id].error = false;
    return draftState;
  },

  [ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_SETTINGS_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id].isSaving = false;
    draftState.settingsSavingStatus[action.payload.id].error = true;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<UpdateModuleInstanceSettingsPayload>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id] = {
      isSaving: true,
      error: false,
    };
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<Action>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id].isSaving = false;
    draftState.settingsSavingStatus[action.payload.id].error = false;
    return draftState;
  },

  [ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.settingsSavingStatus[action.payload.id].isSaving = false;
    draftState.settingsSavingStatus[action.payload.id].error = true;
    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.deletingStatus[action.payload.id] = {
      isDeleting: true,
      error: false,
    };

    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.deletingStatus[action.payload.id].isDeleting = false;
    draftState.deletingStatus[action.payload.id].error = false;

    return draftState;
  },

  [ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR]: (
    draftState: ModuleInstancePaneState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.deletingStatus[action.payload.id].isDeleting = false;
    draftState.deletingStatus[action.payload.id].error = true;

    return draftState;
  },
};

const moduleInstanceReducer = createImmerReducer(initialState, handlers);

export default moduleInstanceReducer;
