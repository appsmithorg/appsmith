import type { DefaultRootState } from "react-redux";
import { ExplorerPinnedState } from "ee/reducers/uiReducers/explorerReducer";

/**
 * returns the pinned state of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerPinned = (state: DefaultRootState) => {
  return state.ui.explorer.pinnedState === ExplorerPinnedState.PINNED;
};

/**
 * returns the width of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerWidth = (state: DefaultRootState) => {
  return state.ui.explorer.width;
};

/**
 * returns the active state  of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerActive = (state: DefaultRootState) => {
  return state.ui.explorer.active;
};

export const getUpdatingEntity = (state: DefaultRootState) => {
  return state.ui.explorer.entity.updatingEntity;
};
export const getEditingEntityName = (state: DefaultRootState) =>
  state.ui.explorer.entity.editingEntityName;
