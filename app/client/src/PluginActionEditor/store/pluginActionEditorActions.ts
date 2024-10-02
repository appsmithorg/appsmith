import type { PluginEditorDebuggerState } from "./pluginEditorReducer";
import {
  type ReduxAction,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";

export const setPluginActionEditorDebuggerState = (
  payload: Partial<PluginEditorDebuggerState>,
) => ({
  type: ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_DEBUGGER_STATE,
  payload,
});

export const setPluginActionEditorSelectedTab = (payload: number) => ({
  type: ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_FORM_SELECTED_TAB,
  payload,
});

export const updatePostBodyContentType = (
  title: string,
  apiId: string,
): ReduxAction<{ title: string; apiId: string }> => ({
  type: ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
  payload: { title, apiId },
});

export const changeApi = (
  id: string,
  isSaas: boolean,
  newApi?: boolean,
): ReduxAction<{ id: string; isSaas: boolean; newApi?: boolean }> => {
  return {
    type: ReduxActionTypes.API_PANE_CHANGE_API,
    payload: { id, isSaas, newApi },
  };
};
