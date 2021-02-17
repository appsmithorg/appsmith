import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const toggleShowGlobalSearchModal = () => ({
  type: ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL,
});
