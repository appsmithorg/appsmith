import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RestAction } from "entities/Action";

export const createQueryRequest = (payload: Partial<RestAction>) => {
  return {
    type: ReduxActionTypes.CREATE_QUERY_INIT,
    payload,
  };
};

export const deleteQuery = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_QUERY_INIT,
    payload,
  };
};

export const deleteQuerySuccess = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_QUERY_SUCCESS,
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
  pluginType: string,
): ReduxAction<{ id: string; pluginType: string }> => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload: { id, pluginType },
  };
};
