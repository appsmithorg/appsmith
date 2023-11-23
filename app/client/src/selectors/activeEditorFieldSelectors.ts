import type { AppState } from "@appsmith/reducers";

export function getActiveEditorField(state: AppState) {
  return state.ui.activeField;
}
