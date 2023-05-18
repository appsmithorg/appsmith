import type { AppState } from "@appsmith/reducers";

export const getJSPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.jsPane.selectedConfigTabIndex;
