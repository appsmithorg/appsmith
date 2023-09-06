import type { AppState } from "@appsmith/reducers";
import type { PageNavState } from "./ideReducer";

export const getIdeSidebarWidth = (state: AppState): number =>
  state.ui.ide.sidebarWidth;

export const getIdePageNav = (state: AppState): PageNavState =>
  state.ui.ide.pageNavState;
