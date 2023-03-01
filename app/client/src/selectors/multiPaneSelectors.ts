import { AppState } from "ce/reducers";

export const getTabsPaneWidth = (state: AppState) =>
  state.ui.multiPaneConfig.tabsPaneWidth;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isMultiPaneActive = (state: AppState) => true;

export const getPaneCount = (state: AppState) =>
  state.ui.multiPaneConfig.paneCount;
