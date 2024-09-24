import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import type { SlashCommandPayload } from "entities/Action";
import type { ApiPaneDebuggerState } from "ee/reducers/uiReducers/apiPaneReducer";

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
  queryDefaultTableName?: string,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  datasourceId: string;
  queryDefaultTableName?: string;
}> => ({
  type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
  payload: { pageId, from, datasourceId, queryDefaultTableName },
});

export const updateBodyContentType = (
  title: string,
  apiId: string,
): ReduxAction<{ title: string; apiId: string }> => ({
  type: ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
  payload: { title, apiId },
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

export const setApiPaneDebuggerState = (
  payload: Partial<ApiPaneDebuggerState>,
) => ({
  type: ReduxActionTypes.SET_API_PANE_DEBUGGER_STATE,
  payload,
});
