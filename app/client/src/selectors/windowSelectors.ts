import type { DefaultRootState } from "react-redux";

export const getWindowDimensions = (state: DefaultRootState) => {
  return state.ui.windowDimensions;
};
