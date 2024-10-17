import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
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
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  runErrorMessage: Record<string, string>;
  selectedConfigTab?: string;
  formData: Record<string, Record<string, { label: string; value: string }>>;
  debugger: PluginEditorDebuggerState;
}

const initialState: PluginActionEditorState = {
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
    action: ReduxAction<{ id: string }>,
  ) => {
    set(state, ["isRunning", action.payload.id], true);
    set(state, ["debugger", "selectedTab"], DEBUGGER_TAB_KEYS.RESPONSE_TAB);
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
  /**
   * This redux action sets the extra form data field for an action. This is used to select the
   * appropriate body type tab selection in the Rest API plugin based on the content-type.
   * This redux action can be extended to other functionalities as well in the future.
   */
  [ReduxActionTypes.SET_EXTRA_FORMDATA]: (
    state: PluginActionEditorState,
    action: ReduxAction<{
      id: string;
      values: Record<string, { label: string; value: string }>;
    }>,
  ) => {
    const { id, values } = action.payload;

    set(state, ["formData", id], values);
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
};

const pluginActionEditorReducer = createImmerReducer(initialState, handlers);

export default pluginActionEditorReducer;
