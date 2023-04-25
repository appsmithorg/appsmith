import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import type { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

export const setTabsPaneWidth = (width: number) => {
  return {
    type: ReduxActionTypes.SET_TABS_PANE_WIDTH,
    payload: {
      width,
    },
  };
};

export const setPaneCount = (count: PaneLayoutOptions) => {
  return {
    type: ReduxActionTypes.SET_PANE_COUNT,
    payload: {
      count,
    },
  };
};
