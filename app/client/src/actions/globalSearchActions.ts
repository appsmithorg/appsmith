import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const updateActiveItemIndex = (index: number) => ({
  type: ReduxActionTypes.UPDATE_GLOBAL_SEARCH_ACTIVE_ITEM_INDEX,
  payload: index,
});

export const setHelpResults = (results: Record<string, any>[]) => ({
  type: ReduxActionTypes.SET_HELP_RESULTS,
  payload: results,
});
