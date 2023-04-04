import type { AppState } from "@appsmith/reducers";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};
