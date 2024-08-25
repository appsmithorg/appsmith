import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { QueryPaneDebuggerState } from "ee/reducers/uiReducers/queryPaneReducer";

export interface ChangeQueryPayload {
  baseQueryId: string;
  packageId?: string;
  applicationId?: string;
  basePageId?: string;
  moduleId?: string;
  workflowId?: string;
  newQuery?: boolean;
  action?: Action;
}

export const changeQuery = (payload: ChangeQueryPayload) => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload,
  };
};

export const setQueryPaneConfigSelectedTabIndex: (
  payload: string,
) => ReduxAction<{ selectedTabIndex: string }> = (payload: string) => ({
  type: ReduxActionTypes.SET_QUERY_PANE_CONFIG_SELECTED_TAB,
  payload: { selectedTabIndex: payload },
});

export const setQueryPaneDebuggerState = (
  payload: Partial<QueryPaneDebuggerState>,
) => {
  return {
    type: ReduxActionTypes.SET_QUERY_PANE_DEBUGGER_STATE,
    payload,
  };
};
