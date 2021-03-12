import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { RecentEntity } from "components/editorComponents/GlobalSearch/utils";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const toggleShowGlobalSearchModal = () => ({
  type: ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL,
});

export const updateRecentEntity = (payload: RecentEntity) => ({
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

export const setRecentEntities = (payload: Array<RecentEntity>) => ({
  type: ReduxActionTypes.SET_RECENT_ENTITIES,
  payload,
});
