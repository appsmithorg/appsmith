import type { AppState } from "@appsmith/reducers";

export function getStateInspectorStatus(state: AppState) {
  return state.ui.stateInspector.status;
}
