import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RestAction } from "entities/Action";

export const createQueryRequest = (payload: Partial<RestAction>) => {
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

export const changeQuery = (id: string): ReduxAction<{ id: string }> => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload: { id },
  };
};
