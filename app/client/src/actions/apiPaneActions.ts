import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
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
  apiType?: string,
): ReduxAction<{ pageId: string; from: EventLocation; apiType?: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_API_ACTION,
  payload: { pageId, from, apiType },
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
  pageId: string,
  params?: any,
): ReduxAction<{
  pageId: string;
  params: any;
}> => ({
  type: ReduxActionTypes.REDIRECT_TO_NEW_INTEGRATIONS,
  payload: { pageId, params },
});

export const executeCommandAction = (payload: SlashCommandPayload) => ({
  type: ReduxActionTypes.EXECUTE_COMMAND,
  payload: payload,
});

export const setApiPaneConfigSelectedTabIndex: (
  payload: number,
) => ReduxAction<{ selectedTabIndex: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_API_PANE_CONFIG_SELECTED_TAB,
  payload: { selectedTabIndex: payload },
});

export const setApiPaneResponseSelectedTab: (
  payload: string,
) => ReduxAction<{ selectedTab: string }> = (payload: string) => ({
  type: ReduxActionTypes.SET_API_PANE_RESPONSE_SELECTED_TAB,
  payload: { selectedTab: payload },
});

export const setApiPaneResponsePaneHeight: (
  payload: number,
) => ReduxAction<{ height: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_API_PANE_RESPONSE_PANE_HEIGHT,
  payload: { height: payload },
});

export const setApiRightPaneSelectedTab: (
  payload: number,
) => ReduxAction<{ selectedTab: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_API_RIGHT_PANE_SELECTED_TAB,
  payload: { selectedTab: payload },
});
