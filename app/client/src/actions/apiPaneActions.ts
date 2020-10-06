import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { EventLocation } from "utils/AnalyticsUtil";

export const changeApi = (
  id: string,
  newApi?: boolean,
): ReduxAction<{ id: string; newApi?: boolean }> => {
  return {
    type: ReduxActionTypes.API_PANE_CHANGE_API,
    payload: { id, newApi },
  };
};

export const initApiPane = (urlId?: string): ReduxAction<{ id?: string }> => {
  return {
    type: ReduxActionTypes.INIT_API_PANE,
    payload: { id: urlId },
  };
};

export const setCurrentCategory = (
  category: string,
): ReduxAction<{ category: string }> => {
  return {
    type: ReduxActionTypes.SET_CURRENT_CATEGORY,
    payload: { category },
  };
};

export const setLastUsedEditorPage = (
  path: string,
): ReduxAction<{ path: string }> => {
  return {
    type: ReduxActionTypes.SET_LAST_USED_EDITOR_PAGE,
    payload: { path },
  };
};

export const setLastSelectedPage = (
  selectedPageId: string,
): ReduxAction<{ selectedPageId: string }> => {
  return {
    type: ReduxActionTypes.SET_LAST_SELECTED_PAGE_PAGE,
    payload: { selectedPageId },
  };
};

export const createNewApiAction = (
  pageId: string,
  from: EventLocation,
): ReduxAction<{ pageId: string; from: EventLocation }> => ({
  type: ReduxActionTypes.CREATE_NEW_API_ACTION,
  payload: { pageId, from },
});

export const createNewQueryAction = (
  pageId: string,
  from: EventLocation,
): ReduxAction<{ pageId: string; from: EventLocation }> => ({
  type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
  payload: { pageId, from },
});
