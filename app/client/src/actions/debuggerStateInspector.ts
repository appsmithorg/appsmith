import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const setDebuggerStateInspectorSelectedItem = (payload: string) => {
  return {
    type: ReduxActionTypes.SET_DEBUGGER_STATE_INSPECTOR_SELECTED_ITEM,
    payload,
  };
};
