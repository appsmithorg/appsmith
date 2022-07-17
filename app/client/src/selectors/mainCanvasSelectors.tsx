import { AppState } from "reducers";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};
