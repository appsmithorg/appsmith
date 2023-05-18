import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const TABS_PANE_MIN_WIDTH = 390;

export enum PaneLayoutOptions {
  TWO_PANE = 2,
  THREE_PANE = 3,
}

const initialState: MultiPaneReduxState = {
  tabsPaneWidth: TABS_PANE_MIN_WIDTH,
  paneCount: PaneLayoutOptions.TWO_PANE,
};

const multiPaneReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_TABS_PANE_WIDTH]: (
    state: MultiPaneReduxState,
    action: ReduxAction<{ width: number }>,
  ) => {
    state.tabsPaneWidth = action.payload.width;
  },
  [ReduxActionTypes.SET_PANE_COUNT]: (
    state: MultiPaneReduxState,
    action: ReduxAction<{ count: PaneLayoutOptions }>,
  ) => {
    state.paneCount = action.payload.count;
  },
});

export interface MultiPaneReduxState {
  tabsPaneWidth: number;
  paneCount: PaneLayoutOptions;
}

export default multiPaneReducer;
