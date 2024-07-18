import type { AppState } from "@appsmith/reducers";

export const isFloatingPaneVisible = (state: AppState) =>
  state.ui.floatingPane.isVisible;
