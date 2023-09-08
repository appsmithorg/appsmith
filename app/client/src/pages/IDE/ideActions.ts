import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { PageNavState, TabState } from "./ideReducer";

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

export const setIdePageTabState = (tab: TabState) => {
  return {
    type: ReduxActionTypes.SET_IDE_PAGE_TAB_STATE,
    payload: tab,
  };
};

export const showAddDatasourceModal = (show: boolean) => {
  return {
    type: ReduxActionTypes.SHOW_ADD_DATASOURCE_MODAL,
    payload: show,
  };
};
