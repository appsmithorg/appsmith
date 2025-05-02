import type { DefaultRootState } from "react-redux";

export const getIsCanvasInitialized = (state: DefaultRootState) => {
  return state.ui.mainCanvas.initialized;
};
