import type { AppState } from "@appsmith/reducers";

export const getJSPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.jsPane.selectedConfigTabIndex;

export const getJSPaneResponseSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedResponseTab;

export const getJSPaneResponsePaneHeight = (state: AppState) =>
  state.ui.jsPane.responseTabHeight;
