import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { Datasource } from "../../api/DatasourcesApi";
import { REST_PLUGIN_ID } from "../../constants/ApiEditorConstants";

export interface DatasourceDataState {
  list: Datasource[];
  loading: boolean;
}

const initialState: DatasourceDataState = {
  list: [],
  loading: false,
};

const datasourceReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_DATASOURCES_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.CREATE_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_DATASOURCES_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource[]>,
  ) => {
    return {
      ...state,
      loading: false,
      // TODO(hetu) Once plugins are being pulled get Ids from there
      list: action.payload.filter(r => r.pluginId === REST_PLUGIN_ID),
    };
  },
  [ReduxActionTypes.CREATE_DATASOURCE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      loading: false,
      list: state.list.concat(action.payload),
    };
  },
});

export default datasourceReducer;
