import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import type { ActionResponse } from "api/ActionAPI";
import { omit } from "lodash";
import { objectKeys } from "@appsmith/utils";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";

export interface PluginEditorDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}

export interface PluginActionEditorState {
  isCreating: boolean;
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  runErrorMessage: Record<string, string>;
  selectedConfigTab?: string;
  formData: Record<string, Record<string, { label: string; value: string }>>;
  debugger: PluginEditorDebuggerState;
}

export const initialState: PluginActionEditorState = {
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  isDirty: {},
  runErrorMessage: {},
  formData: {},
  debugger: {
    open: false,
    responseTabHeight: ActionExecutionResizerHeight,
  },
};

export const handlers = {
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state: PluginActionEditorState) => {
    return {
      ...state,
      isCreating: true,
    };
  },
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
  ) => {
    return {
      ...state,
      isCreating: false,
    };
  },
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (
    state: PluginActionEditorState,
  ) => {
    return {
      ...state,
      isCreating: false,
    };
  },
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    state: PluginActionEditorState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => ({
    ...state,
    isDirty: {
      ...state.isDirty,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ data: Action }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ): PluginActionEditorState => {
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.id]: true,
      },
      debugger: {
        ...state.debugger,
        selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        open: true,
      },
    };
  },

  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.id]: false,
      },
    };
  },

  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = objectKeys(action.payload)[0];

    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [actionId]: false,
      },
      runErrorMessage: omit(state.runErrorMessage, [actionId]),
    };
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string; error: Error }>,
  ) => {
    const { error, id } = action.payload;

    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [id]: false,
      },
      runErrorMessage: {
        ...state.runErrorMessage,
        [id]: error.message,
      },
    };
  },
  /**
   * This redux action sets the extra form data field for an action. This is used to select the
   * appropriate body type tab selection in the Rest API plugin based on the content-type.
   * This redux action can be extended to other functionalities as well in the future.
   *
   * @param {PluginActionEditorState} state
   * @param {ReduxAction} action
   * @returns {PluginActionEditorState}
   */
  [ReduxActionTypes.SET_EXTRA_FORMDATA]: (
    state: PluginActionEditorState,
    action: ReduxAction<{
      id: string;
      values: Record<string, { label: string; value: string }>;
    }>,
  ): PluginActionEditorState => {
    const { id, values } = action.payload;

    return {
      ...state,
      formData: {
        [id]: values,
      },
    };
  },
  [ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_FORM_SELECTED_TAB]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ selectedTab: string }>,
  ): PluginActionEditorState => {
    const { selectedTab } = action.payload;

    return {
      ...state,
      selectedConfigTab: selectedTab,
    };
  },
  [ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_DEBUGGER_STATE]: (
    state: PluginActionEditorState,
    action: ReduxAction<Partial<PluginEditorDebuggerState>>,
  ) => {
    return {
      ...state,
      debugger: {
        ...state.debugger,
        ...action.payload,
      },
    };
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: PluginActionEditorState) => {
    return {
      ...state,
      isSaving: {},
    };
  },
};

const pluginActionEditorReducer = createReducer(initialState, handlers);

export default pluginActionEditorReducer;
