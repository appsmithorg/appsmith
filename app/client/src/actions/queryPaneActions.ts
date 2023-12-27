import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";

export interface ChangeQueryPayload {
  id: string;
  packageId?: string;
  applicationId?: string;
  pageId?: string;
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
