import type { DefaultRootState } from "react-redux";

export function getActiveEditorField(state: DefaultRootState) {
  return state.ui.activeField;
}
