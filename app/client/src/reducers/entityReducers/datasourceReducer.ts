import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { Datasource } from "api/DatasourcesApi";

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
      list: action.payload,
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
