import type { AppState } from "ee/reducers";
import { ExplorerPinnedState } from "ee/reducers/uiReducers/explorerReducer";

/**
 * returns the pinned state of explorer
 *
 * @param state
 * @returns
 */
export const getExplorerPinned = (state: AppState) => {
  return state.ui.explorer.pinnedState === ExplorerPinnedState.PINNED;
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

export const getUpdatingEntity = (state: AppState) => {
  return state.ui.explorer.entity.updatingEntity;
};
export const getEditingEntityName = (state: AppState) =>
  state.ui.explorer.entity.editingEntityName;
