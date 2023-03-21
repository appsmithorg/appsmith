import type { AppState } from "@appsmith/reducers";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};

export const getIsMobile = (state: AppState) => state.ui.mainCanvas.isMobile;
