import type { AppState } from "ee/reducers";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};
