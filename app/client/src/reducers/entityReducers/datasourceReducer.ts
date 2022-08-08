import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  Datasource,
  DatasourceStructure,
  MockDatasource,
} from "entities/Datasource";

export interface DatasourceDataState {
  list: Datasource[];
  loading: boolean;
  isTesting: boolean;
  isDeleting: boolean;
  isListing: boolean; // fetching unconfigured datasource list
  fetchingDatasourceStructure: boolean;
  isRefreshingStructure: boolean;
  structure: Record<string, DatasourceStructure>;
  isFetchingMockDataSource: false;
  mockDatasourceList: any[];
  executingDatasourceQuery: boolean;
  isReconnectingModalOpen: boolean; // reconnect datasource modal for import application
  unconfiguredList: Datasource[];
}

const initialState: DatasourceDataState = {
  list: [],
  loading: false,
  isTesting: false,
  isDeleting: false,
  isListing: false,
  fetchingDatasourceStructure: false,
  isRefreshingStructure: false,
  structure: {},
  isFetchingMockDataSource: false,
  mockDatasourceList: [],
  executingDatasourceQuery: false,
  isReconnectingModalOpen: false,
  unconfiguredList: [],
};

const datasourceReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, isFetchingMockDataSource: true };
  },
  [ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<any>,
  ) => {
    const mockDatasourceList = action.payload as MockDatasource[];
    return { ...state, isFetchingMockDataSource: false, mockDatasourceList };
  },
  [ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, isFetchingMockDataSource: false };
  },
  [ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.ADD_MOCK_DATASOURCES_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      loading: false,
      list: state.list.concat(action.payload),
    };
  },
  [ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, loading: false };
  },
  [ReduxActionTypes.FETCH_DATASOURCES_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.CREATE_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.TEST_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, isTesting: true };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, isDeleting: true };
  },
  [ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, isRefreshingStructure: true };
  },
  [ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, executingDatasourceQuery: true };
  },
  [ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_SUCCESS]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, executingDatasourceQuery: false };
  },
  [ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, fetchingDatasourceStructure: true };
  },
  [ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ data: DatasourceStructure; datasourceId: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: false,
      structure: {
        ...state.structure,
        [action.payload.datasourceId]: action.payload.data,
      },
    };
  },
  [ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ data: DatasourceStructure; datasourceId: string }>,
  ) => {
    return {
      ...state,
      isRefreshingStructure: false,
      structure: {
        ...state.structure,
        [action.payload.datasourceId]: action.payload.data,
      },
    };
  },
  [ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: false,
    };
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
  [ReduxActionTypes.TEST_DATASOURCE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{
      show: boolean;
      id?: string;
      messages?: Array<string>;
      error?: any;
    }>,
  ): DatasourceDataState => {
    if (action.payload.id) {
      const list = state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, messages: action.payload.messages };
        }
        return datasource;
      });
      const unconfiguredList = state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, messages: action.payload.messages };
        }
        return datasource;
      });
      return {
        ...state,
        isTesting: false,
        list: list,
        unconfiguredList: unconfiguredList,
      };
    }
    return {
      ...state,
      isTesting: false,
    };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      isDeleting: false,
      list: state.list.filter(
        (datasource) => datasource.id !== action.payload.id,
      ),
    };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_CANCELLED]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      isDeleting: false,
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
  [ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ): DatasourceDataState => {
    return {
      ...state,
      loading: false,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) return action.payload;

        return datasource;
      }),
      unconfiguredList: state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) return action.payload;

        return datasource;
      }),
    };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_IMPORT_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ): DatasourceDataState => {
    return {
      ...state,
      loading: false,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) return action.payload;

        return datasource;
      }),
      unconfiguredList: state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) return action.payload;

        return datasource;
      }),
    };
  },
  [ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ): DatasourceDataState => {
    return {
      ...state,
      loading: false,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) return action.payload;

        return datasource;
      }),
    };
  },
  [ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      loading: false,
    };
  },
  [ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, isDeleting: false };
  },
  [ReduxActionErrorTypes.TEST_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
    action: ReduxAction<{
      show: boolean;
      id?: string;
      messages?: Array<string>;
      error?: any;
    }>,
  ): DatasourceDataState => {
    if (action.payload.id) {
      const list = state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, messages: action.payload.messages };
        }
        return datasource;
      });
      const unconfiguredList = state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, messages: action.payload.messages };
        }
        return datasource;
      });
      return {
        ...state,
        isTesting: false,
        list: list,
        unconfiguredList: unconfiguredList,
      };
    }
    return {
      ...state,
      isTesting: false,
    };
  },
  [ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
  ): DatasourceDataState => {
    return {
      ...state,
      loading: false,
    };
  },
  [ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      isRefreshingStructure: false,
    };
  },
  [ReduxActionErrorTypes.EXECUTE_DATASOURCE_QUERY_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      executingDatasourceQuery: false,
    };
  },
  [ReduxActionTypes.SET_IS_RECONNECTING_DATASOURCES_MODAL_OPEN]: (
    state: DatasourceDataState,
    action: ReduxAction<{ isOpen: boolean }>,
  ) => {
    return {
      ...state,
      isReconnectingModalOpen: action.payload.isOpen,
    };
  },
  [ReduxActionTypes.SET_UNCONFIGURED_DATASOURCES]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource[] | undefined>,
  ) => {
    return {
      ...state,
      isListing: false,
      unconfiguredList: action.payload,
    };
  },
  [ReduxActionTypes.FETCH_UNCONFIGURED_DATASOURCE_LIST]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      isListing: true,
      unconfiguredList: [],
    };
  },
});

export default datasourceReducer;
