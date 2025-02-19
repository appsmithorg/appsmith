import type { AppState } from "ee/reducers";

export const getDebuggerStateInspectorSelectedItem = (state: AppState) =>
  state.ui.debugger.stateInspector.selectedItemId;
