import type { AppState } from "@appsmith/reducers";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

export const getQueryPaneResponsePaneHeight = (state: AppState) =>
  state.ui.queryPane.responseTabHeight;
