import { AppState } from "reducers";

/**
 * returns the pinned state of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerPinned = (state: AppState) => {
  return state.ui.explorer.pinned;
};

/**
 * returns the width of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerWidth = (state: AppState) => {
  return state.ui.explorer.width;
};

/**
 * returns the active state  of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerActive = (state: AppState) => {
  return state.ui.explorer.active;
};
