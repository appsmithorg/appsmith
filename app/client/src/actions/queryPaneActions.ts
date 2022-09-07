import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { Action } from "entities/Action";

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
  payload: number,
) => ReduxAction<{ selectedTabIndex: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_QUERY_PANE_CONFIG_SELECTED_TAB,
  payload: { selectedTabIndex: payload },
});

export const setQueryPaneResponseSelectedTabIndex: (
  payload: number,
) => ReduxAction<{ selectedTabIndex: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_QUERY_PANE_RESPONSE_SELECTED_TAB,
  payload: { selectedTabIndex: payload },
});

export const setQueryPaneResponsePaneHeight: (
  payload: number,
) => ReduxAction<{ height: number }> = (payload: number) => ({
  type: ReduxActionTypes.SET_QUERY_PANE_RESPONSE_PANE_HEIGHT,
  payload: { height: payload },
});
