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
};

export const initialState: EditorReduxState = {
  ...CE_initialState,
  isPackageEditorInitialized: false,
  isPackagePublishing: false,
  isModuleFetchingActions: false,
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

  [ReduxActionTypes.SET_CURRENT_MODULE]: (
    state: EditorReduxState,
    action: ReduxAction<{ id?: string | null }>,
  ) => {
    return {
      ...state,
      currentModuleId: action.payload.id,
    };
  },
};

export default createReducer(initialState, handlers);
