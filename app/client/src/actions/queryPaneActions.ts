import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";

export const changeQuery = (
  id: string,
  newQuery?: boolean,
  action?: Action,
): ReduxAction<{
  id: string;
  newQuery?: boolean;
  action?: any;
}> => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload: { id, newQuery, action },
  };
};

export const setQueryPaneConfigSelectedTabIndex: (
  payload: string,
) => ReduxAction<{ selectedTabIndex: string }> = (payload: string) => ({
  type: ReduxActionTypes.SET_QUERY_PANE_CONFIG_SELECTED_TAB,
  payload: { selectedTabIndex: payload },
});
