import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setIdeSidebarWidth = (width: number) => {
  return {
    type: ReduxActionTypes.SET_IDE_SIDEBAR_WIDTH,
    payload: width,
  };
};
