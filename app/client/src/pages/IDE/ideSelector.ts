import type { AppState } from "@appsmith/reducers";

export const getIdeSidebarWidth = (state: AppState): number =>
  state.ui.ide.sidebarWidth;
