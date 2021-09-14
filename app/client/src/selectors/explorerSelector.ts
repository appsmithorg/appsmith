import { AppState } from "reducers";

/**
 * returns the pinned state of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerPinned = (state: AppState) => {
  // eslint-disable-next-line
  console.log({ state });
  return state.ui.explorer.pinned;
};
