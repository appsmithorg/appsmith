import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const toggleShowGlobalSearchModal = () => ({
  type: ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL,
});

export const updateRecentEntity = (payload: { type: string; id: string }) => ({
  type: ReduxActionTypes.UPDATE_RECENT_ENTITY,
  payload,
});

export const restoreRecentEntitiesRequest = (payload: string) => ({
  type: ReduxActionTypes.RESTORE_RECENT_ENTITIES_REQUEST,
  payload,
});

export const restoreRecentEntitiesSuccess = () => ({
  type: ReduxActionTypes.RESTORE_RECENT_ENTITIES_SUCCESS,
});

export const resetRecentEntities = () => ({
  type: ReduxActionTypes.RESET_RECENT_ENTITIES,
});

export const setRecentEntities = (
  payload: Array<{ type: string; id: string }>,
) => ({
  type: ReduxActionTypes.SET_RECENT_ENTITIES,
  payload,
});
