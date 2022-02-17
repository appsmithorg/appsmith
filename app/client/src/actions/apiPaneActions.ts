import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { EventLocation } from "utils/AnalyticsUtil";
import { SlashCommandPayload } from "entities/Action";

export const changeApi = (
  id: string,
  isSaas: boolean,
  newApi?: boolean,
): ReduxAction<{ id: string; isSaas: boolean; newApi?: boolean }> => {
  return {
    type: ReduxActionTypes.API_PANE_CHANGE_API,
    payload: { id, isSaas, newApi },
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
  datasourceId: string,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  datasourceId: string;
}> => ({
  type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
  payload: { pageId, from, datasourceId },
});

export const updateBodyContentType = (
  title: string,
  apiId: string,
): ReduxAction<{ title: string; apiId: string }> => ({
  type: ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
  payload: { title, apiId },
});

export const redirectToNewIntegrations = (
  applicationId: string,
  pageId: string,
  params?: any,
): ReduxAction<{
  applicationId: string;
  pageId: string;
  params: any;
}> => ({
  type: ReduxActionTypes.REDIRECT_TO_NEW_INTEGRATIONS,
  payload: { applicationId, pageId, params },
});

export const executeCommandAction = (payload: SlashCommandPayload) => ({
  type: ReduxActionTypes.EXECUTE_COMMAND,
  payload: payload,
});
