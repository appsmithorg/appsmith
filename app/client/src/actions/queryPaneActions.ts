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
): ReduxAction<{ id: string; newQuery?: boolean }> => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload: { id, newQuery },
  };
};
