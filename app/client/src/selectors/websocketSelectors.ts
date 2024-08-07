import type { AppState } from "ee/reducers";

export const getIsPageLevelSocketConnected = (state: AppState) =>
  state.ui.websocket.pageLevelSocketConnected;
export const getIsAppLevelSocketConnected = (state: AppState) =>
  state.ui.websocket.appLevelSocketConnected;
