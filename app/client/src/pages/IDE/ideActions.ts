import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { PageNavState } from "./ideReducer";

export const setIdeSidebarWidth = (width: number) => {
  return {
    type: ReduxActionTypes.SET_IDE_SIDEBAR_WIDTH,
    payload: width,
  };
};

export const setIdePageNav = (nav: PageNavState) => {
  return {
    type: ReduxActionTypes.SET_IDE_PAGE_NAV,
    payload: nav,
  };
};
