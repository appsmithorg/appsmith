import { AppState } from "ce/reducers";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

export const getTabsPaneWidth = (state: AppState) =>
  state.ui.multiPaneConfig.tabsPaneWidth;

export const isMultiPaneActive = (state: AppState) =>
  state.ui.users.featureFlag.data.MULTIPLE_PANES === true;

export const getPaneCount = (state: AppState) =>
  state.ui.multiPaneConfig.paneCount;

export const isOnePaneLayout = (state: AppState) =>
  state.ui.multiPaneConfig.paneCount === PaneLayoutOptions.ONE_PANE;
