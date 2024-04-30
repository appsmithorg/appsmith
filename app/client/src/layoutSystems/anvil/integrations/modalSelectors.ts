import type { AppState } from "@appsmith/reducers";

export const getCurrentlyOpenAnvilDetachedWidgets = (state: AppState) => {
  return state.ui.anvilDetachedWidgets.currentlyOpenDetachedWidgets;
};
