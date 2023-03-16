import type { AppState } from "@appsmith/reducers";

export const getIsPageLevelSocketConnected = (state: AppState) =>
  state.ui.websocket.pageLevelSocketConnected;
export const getIsAppLevelSocketConnected = (state: AppState) =>
  state.ui.websocket.appLevelSocketConnected;
