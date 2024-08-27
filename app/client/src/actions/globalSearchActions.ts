import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  RecentEntity,
  SearchCategory,
} from "components/editorComponents/GlobalSearch/utils";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const toggleShowGlobalSearchModal = () => ({
  type: ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL,
});

export const setGlobalSearchCategory = (
  category: SearchCategory = filterCategories[SEARCH_CATEGORY_ID.INIT],
) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_CATEGORY,
  payload: category,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setGlobalSearchFilterContext = (payload: any) => ({
  type: ReduxActionTypes.SET_SEARCH_FILTER_CONTEXT,
  payload,
});

export const restoreRecentEntitiesRequest = (payload: {
  applicationId: string;
  branch?: string;
}) => ({
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
