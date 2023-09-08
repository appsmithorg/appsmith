import type { AppState } from "@appsmith/reducers";
import type { PageNavState, TabState } from "./ideReducer";
import type { Item } from "./components/ListView";

export const getIdeSidebarWidth = (state: AppState): number =>
  state.ui.ide.sidebarWidth;

export const getIdePageNav = (state: AppState): PageNavState =>
  state.ui.ide.pageNavState;

export const getIdePageTabState = (state: AppState): TabState =>
  state.ui.ide.pageTabState;

export const showAddDatasourceModalSelector = (state: AppState): boolean =>
  state.ui.ide.showAddDatasourceModal;
export const getRecentQueryList = (state: AppState): Item[] =>
  state.ui.ide.queryList;

export const getRecentJsList = (state: AppState): Item[] => state.ui.ide.jsList;
