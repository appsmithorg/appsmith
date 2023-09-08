import type { AppState } from "@appsmith/reducers";
import type { PageNavState, TabState } from "./ideReducer";

export const getIdeSidebarWidth = (state: AppState): number =>
  state.ui.ide.sidebarWidth;

export const getIdePageNav = (state: AppState): PageNavState =>
  state.ui.ide.pageNavState;

export const getIdePageTabState = (state: AppState): TabState =>
  state.ui.ide.pageTabState;

export const showAddDatasourceModalSelector = (state: AppState): boolean =>
  state.ui.ide.showAddDatasourceModal;
