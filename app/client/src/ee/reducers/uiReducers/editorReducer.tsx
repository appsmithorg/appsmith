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
  isModuleFetchingEntities: boolean;
  currentWorkflowId?: string;
  isWorkflowPublishing: boolean;
  isWorkflowEditorInitialized: boolean;
  isModuleUpdating: boolean;
};

export const initialState: EditorReduxState = {
  ...CE_initialState,
  isPackageEditorInitialized: false,
  isPackagePublishing: false,
  isWorkflowPublishing: false,
  isModuleFetchingEntities: false,
  isWorkflowEditorInitialized: false,
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

  [ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isModuleFetchingEntities: true,
    };
  },

  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleFetchingEntities: false,
    };
  },

  [ReduxActionErrorTypes.FETCH_MODULE_ENTITIES_ERROR]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isModuleFetchingEntities: false,
    };
  },

  [ReduxActionTypes.SET_CURRENT_WORKFLOW_ID]: (
    state: EditorReduxState,
    action: ReduxAction<{ workflowId: string }>,
  ) => {
    return {
      ...state,
      currentWorkflowId: action.payload.workflowId,
    };
  },

  [ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      isWorkflowEditorInitialized: true,
    };
  },
  [ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR]: (state: EditorReduxState) => {
    return {
      ...state,
      isWorkflowEditorInitialized: false,
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

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        savingEntity: true,
      },
    };
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        savingEntity: false,
      },
    };
  },

  [ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ERROR]: (
    state: EditorReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        savingEntity: false,
      },
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

  [ReduxActionTypes.PUBLISH_WORKFLOW_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      isWorkflowPublishing: true,
    };
  },

  [ReduxActionTypes.PUBLISH_WORKFLOW_SUCCESS]: (state: EditorReduxState) => {
    return {
      ...state,
      isWorkflowPublishing: false,
    };
  },

  [ReduxActionErrorTypes.PUBLISH_WORKFLOW_ERROR]: (state: EditorReduxState) => {
    return {
      ...state,
      isWorkflowPublishing: false,
    };
  },
};

export default createReducer(initialState, handlers);
