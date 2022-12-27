import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const setTabsPaneWidth = (width: number) => {
  return {
    type: ReduxActionTypes.SET_TABS_PANE_WIDTH,
    payload: {
      width,
    },
  };
};
