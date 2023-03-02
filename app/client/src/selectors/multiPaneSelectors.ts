import { AppState } from "ce/reducers";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";
import { createSelector } from "reselect";

export const getTabsPaneWidth = (state: AppState) =>
  state.ui.multiPaneConfig.tabsPaneWidth;

export const getPaneCount = (state: AppState) =>
  state.ui.multiPaneConfig.paneCount;

export const isMultiPaneActive = createSelector(getPaneCount, (paneCount) => {
  return paneCount !== PaneLayoutOptions.ONE_PANE;
});
