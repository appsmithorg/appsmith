import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import { ActionExecutionResizerHeight } from "../components/PluginActionResponse/constants";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import type { ActionResponse } from "api/ActionAPI";
import { omit, set } from "lodash";
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
  isSchemaGenerating: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  runErrorMessage: Record<string, string>;
  selectedConfigTab?: string;
  debugger: PluginEditorDebuggerState;
  settingsOpen?: boolean;
}

const initialState: PluginActionEditorState = {
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isSchemaGenerating: {},
  isDeleting: {},
  isDirty: {},
  runErrorMessage: {},
  debugger: {
    open: false,
    responseTabHeight: ActionExecutionResizerHeight,
  },
  settingsOpen: false,
};

export const handlers = {
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state: PluginActionEditorState) => {
    state.isCreating = true;
  },
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
  ) => {
    state.isCreating = false;
  },
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (
    state: PluginActionEditorState,
  ) => {
    state.isCreating = false;
  },
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    state: PluginActionEditorState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => {
    set(state, ["isDirty", action.payload.id], true);
  },
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSaving", action.payload.id], true);
  },
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ data: Action }>,
  ) => {
    set(state, ["isSaving", action.payload.data.id], false);
    set(state, ["isDirty", action.payload.data.id], false);
  },
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSaving", action.payload.id], false);
  },
  [ReduxActionTypes.DELETE_ACTION_INIT]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isDeleting", action.payload.id], true);
  },
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isDeleting", action.payload.id], false);
  },
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isDeleting", action.payload.id], false);
  },
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state: PluginActionEditorState,
    action: ReduxAction<{
      skipOpeningDebugger: boolean;
      id: string;
    }>,
  ) => {
    set(state, ["isRunning", action.payload.id], true);

    if (!action.payload.skipOpeningDebugger) {
      set(state, ["debugger", "selectedTab"], DEBUGGER_TAB_KEYS.RESPONSE_TAB);
    }

    set(state, ["debugger", "open"], true);
  },
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isRunning", action.payload.id], false);
  },

  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<Record<string, ActionResponse>>,
  ) => {
    const actionId = objectKeys(action.payload)[0];

    set(state, ["isRunning", actionId], false);
    set(state, ["runErrorMessage"], omit(state.runErrorMessage, [actionId]));
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string; error: Error }>,
  ) => {
    const { error, id } = action.payload;

    set(state, ["isRunning", id], false);
    set(state, ["runErrorMessage", id], error.message);
  },
  [ReduxActionTypes.GENERATE_PLUGIN_ACTION_SCHEMA_REQUEST]: (
    state: PluginActionEditorState,
    action: ReduxAction<{
      id: string;
    }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], true);
  },
  [ReduxActionTypes.GENERATE_PLUGIN_ACTION_SCHEMA_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], false);
  },
  [ReduxActionErrorTypes.GENERATE_PLUGIN_ACTION_SCHEMA_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], false);
  },
  [ReduxActionTypes.GENERATE_AI_AGENT_SCHEMA_REQUEST]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], true);
  },
  [ReduxActionTypes.GENERATE_AI_AGENT_SCHEMA_SUCCESS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], false);
  },
  [ReduxActionErrorTypes.GENERATE_AI_AGENT_SCHEMA_ERROR]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isSchemaGenerating", action.payload.id], false);
  },
  [ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_FORM_SELECTED_TAB]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ selectedTab: string }>,
  ) => {
    const { selectedTab } = action.payload;

    state.selectedConfigTab = selectedTab;
  },
  [ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_DEBUGGER_STATE]: (
    state: PluginActionEditorState,
    action: ReduxAction<Partial<PluginEditorDebuggerState>>,
  ) => {
    state.debugger = {
      ...state.debugger,
      ...action.payload,
    };
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: PluginActionEditorState) => {
    state.isSaving = {};
  },
  [ReduxActionTypes.OPEN_PLUGIN_ACTION_SETTINGS]: (
    state: PluginActionEditorState,
    action: ReduxAction<{ settingsOpen: boolean }>,
  ) => {
    const { settingsOpen } = action.payload;

    state.settingsOpen = settingsOpen;
  },
};

const pluginActionEditorReducer = createImmerReducer(initialState, handlers);

export default pluginActionEditorReducer;
