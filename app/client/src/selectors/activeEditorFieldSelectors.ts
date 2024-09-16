import type { AppState } from "ee/reducers";

export function getActiveEditorField(state: AppState) {
  return state.ui.activeField;
}
