export * from "ce/reducers/uiReducers/editorReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/uiReducers/editorReducer";
import type { EditorReduxState as CE_EditorReduxState } from "ce/reducers/uiReducers/editorReducer";
import { createReducer } from "utils/ReducerUtils";

export type EditorReduxState = CE_EditorReduxState & {
  isPackageEditorInitialized: boolean;
  currentModuleId?: string;
  currentPackageId?: string;
  isPackagePublishing: boolean;
};

export const initialState: EditorReduxState = {
  ...CE_initialState,
  isPackageEditorInitialized: false,
  isPackagePublishing: false,
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
};

export default createReducer(initialState, handlers);
