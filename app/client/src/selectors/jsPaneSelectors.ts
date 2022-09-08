import { AppState } from "ce/reducers";

export const getJSPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.jsPane.selectedConfigTabIndex;

export const getJSPaneResponseSelectedTabIndex = (state: AppState) =>
  state.ui.jsPane.selectedResponseTabIndex;

export const getJSPaneResponsePaneHeight = (state: AppState) =>
  state.ui.jsPane.responseTabHeight;
