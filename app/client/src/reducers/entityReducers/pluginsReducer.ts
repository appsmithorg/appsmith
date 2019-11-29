import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { Plugin } from "api/PluginApi";

export interface PluginDataState {
  list: Plugin[];
  loading: boolean;
}

const initialState: PluginDataState = {
  list: [],
  loading: false,
};

const pluginsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PLUGINS_REQUEST]: (state: PluginDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_PLUGINS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<Plugin[]>,
  ) => {
    return {
      ...state,
      loading: false,
      list: action.payload,
    };
  },
  [ReduxActionTypes.FETCH_PLUGINS_ERROR]: (state: PluginDataState) => {
    return {
      ...state,
      loading: false,
    };
  },
});

export default pluginsReducer;
