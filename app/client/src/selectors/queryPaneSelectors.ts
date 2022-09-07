import { AppState } from "ce/reducers";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

export const getQueryPaneResponseSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedResponseTabIndex;

export const getQueryPaneResponsePaneHeight = (state: AppState) =>
  state.ui.queryPane.responseTabHeight;
