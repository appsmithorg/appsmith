import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { Action } from "entities/Action";

export const createQueryRequest = (payload: Partial<Action>) => {
  return {
    type: ReduxActionTypes.CREATE_QUERY_INIT,
    payload,
  };
};

export const initQueryPane = (
  pluginType: string,
  urlId?: string,
): ReduxAction<{ pluginType: string; id?: string }> => {
  return {
    type: ReduxActionTypes.INIT_QUERY_PANE,
    payload: { id: urlId, pluginType },
  };
};

export const changeQuery = (
  id: string,
  newQuery?: boolean,
  action?: Action,
): ReduxAction<{ id: string; newQuery?: boolean; action?: any }> => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload: { id, newQuery, action },
  };
};

/* This action when executed updates the status of isSaving query to true for an actionId */
export const preparingForUpdateAction = (
  payload: ReduxAction<{ id: string }>,
) => ({
  type: ReduxActionTypes.PREPARING_UPDATE_ACTION,
  payload: payload,
});
