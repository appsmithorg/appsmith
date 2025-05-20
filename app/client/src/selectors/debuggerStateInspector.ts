import type { DefaultRootState } from "react-redux";

export const getDebuggerStateInspectorSelectedItem = (
  state: DefaultRootState,
) => state.ui.debugger.stateInspector.selectedItemId;
