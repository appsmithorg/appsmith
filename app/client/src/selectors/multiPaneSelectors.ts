import type { AppState } from "ce/reducers";

export const getTabsPaneWidth = (state: AppState) =>
  state.ui.multiPaneConfig.tabsPaneWidth;

export const isMultiPaneActive = (state: AppState) =>
  state.ui.users.featureFlag.data.MULTIPLE_PANES === true;

export const getPaneCount = (state: AppState) =>
  state.ui.multiPaneConfig.paneCount;
