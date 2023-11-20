export * from "ce/reducers/uiReducers/editorReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/uiReducers/editorReducer";
import type { EditorReduxState as CE_EditorReduxState } from "ce/reducers/uiReducers/editorReducer";
import { createReducer } from "utils/ReducerUtils";

export type EditorReduxState = CE_EditorReduxState & {
  isPackageEditorInitialized: boolean;
  currentModuleId?: string | null;
  currentPackageId?: string;
  isPackagePublishing: boolean;
  isModuleFetchingActions: boolean;
  isModuleUpdating: boolean;
};

export const initialState: EditorReduxState = {
  ...CE_initialState,
  isPackageEditorInitialized: false,
  isPackagePublishing: false,
  isModuleFetchingActions: false,
  isModuleUpdating: false,
};

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isPackageEditorInitialized: true,
    };
  },
  [ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR]: (state: EditorReduxState) => {
    return {
      ...state,
      isPackageEditorInitialized: false,
    };
  },

  [ReduxActionTypes.SET_CURRENT_PACKAGE_ID]: (
    state: EditorReduxState,
    action: ReduxAction<{ packageId: string }>,
  ) => {
    return {
      ...state,
      currentPackageId: action.payload.packageId,
    };
  },

  [ReduxActionTypes.FETCH_MODULE_ACTIONS_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleFetchingActions: true,
    };
  },

  [ReduxActionTypes.FETCH_MODULE_ACTIONS_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleFetchingActions: false,
    };
  },

  [ReduxActionErrorTypes.FETCH_MODULE_ACTIONS_ERROR]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleFetchingActions: false,
    };
  },

  [ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleUpdating: true,
    };
  },

  [ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleUpdating: false,
    };
  },

  [ReduxActionErrorTypes.UPDATE_MODULE_INPUTS_ERROR]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleUpdating: false,
    };
  },

  [ReduxActionTypes.SAVE_MODULE_NAME_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleUpdating: true,
    };
  },

  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleUpdating: false,
    };
  },

  [ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleUpdating: false,
    };
  },

  [ReduxActionTypes.SET_CURRENT_MODULE]: (
    state: EditorReduxState,
    action: ReduxAction<{ id?: string | null }>,
  ) => {
    return {
      ...state,
      currentModuleId: action.payload.id,
    };
  },

  [ReduxActionTypes.PUBLISH_PACKAGE_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isPackagePublishing: true,
    };
  },

  [ReduxActionTypes.PUBLISH_PACKAGE_SUCCESS]: (state: EditorReduxState) => {
    return {
      ...state,
      isPackagePublishing: false,
    };
  },

  [ReduxActionErrorTypes.PUBLISH_PACKAGE_ERROR]: (state: EditorReduxState) => {
    return {
      ...state,
      isPackagePublishing: false,
    };
  },
};

export default createReducer(initialState, handlers);
