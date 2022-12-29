import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const setTabsPaneWidth = (width: number) => {
  return {
    type: ReduxActionTypes.SET_TABS_PANE_WIDTH,
    payload: {
      width,
    },
  };
};

export const setPaneCount = (count: 2 | 3) => {
  return {
    type: ReduxActionTypes.SET_PANE_COUNT,
    payload: {
      count,
    },
  };
};
