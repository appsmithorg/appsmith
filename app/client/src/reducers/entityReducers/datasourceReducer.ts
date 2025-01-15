import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  Datasource,
  DatasourceStorage,
  DatasourceStructure,
  MockDatasource,
} from "entities/Datasource";
import { ToastMessageType } from "entities/Datasource";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import type { DropdownOption } from "@appsmith/ads-old";
import produce from "immer";
import { assign } from "lodash";

export interface DatasourceDataState {
  list: Datasource[];
  loading: boolean;
  loadingTokenForDatasourceId: string | null;
  isTesting: boolean;
  isListing: boolean; // fetching unconfigured datasource list
  fetchingDatasourceStructure: Record<string, boolean>;
  structure: Record<string, DatasourceStructure>;
  isFetchingMockDataSource: false;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockDatasourceList: any[];
  executingDatasourceQuery: boolean;
  isReconnectingModalOpen: boolean; // reconnect datasource modal for import application
  unconfiguredList: Datasource[];
  isDatasourceBeingSaved: boolean;
  isDatasourceBeingSavedFromPopup: boolean;
  gsheetToken: string;
  gsheetProjectID: string;
  gsheetStructure: {
    spreadsheets: Record<string, { value?: DropdownOption[]; error?: string }>;
    sheets: Record<string, { value?: DropdownOption[]; error?: string }>;
    columns: Record<string, { value?: DropdownOption[]; error?: string }>;
    isFetchingSpreadsheets: boolean;
    isFetchingSheets: boolean;
    isFetchingColumns: boolean;
  };
  recentDatasources: string[];
}

const initialState: DatasourceDataState = {
  list: [],
  loading: false,
  loadingTokenForDatasourceId: null,
  isTesting: false,
  isListing: false,
  fetchingDatasourceStructure: {},
  structure: {},
  isFetchingMockDataSource: false,
  mockDatasourceList: [],
  executingDatasourceQuery: false,
  isReconnectingModalOpen: false,
  unconfiguredList: [],
  isDatasourceBeingSaved: false,
  isDatasourceBeingSavedFromPopup: false,
  gsheetToken: "",
  gsheetProjectID: "",
  gsheetStructure: {
    spreadsheets: {},
    sheets: {},
    columns: {},
    isFetchingSpreadsheets: false,
    isFetchingSheets: false,
    isFetchingColumns: false,
  },
  recentDatasources: [],
};

const datasourceReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT]: (
    state: DatasourceDataState,
  ) => {
    return { ...state, isFetchingMockDataSource: true };
  },
  [ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS]: (
    state: DatasourceDataState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  [ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_TOGGLE_LOADING]: (
    state: DatasourceDataState,
    action: ReduxAction<{ loading?: boolean }>,
  ) => {
    return { ...state, loading: !!action.payload.loading };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.TEST_DATASOURCE_INIT]: (state: DatasourceDataState) => {
    return { ...state, isTesting: true };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_INIT]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, isDeleting: true };
        }

        return datasource;
      }),
    };
  },
  [ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.id]: true,
      },
    };
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
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.id]: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ data: DatasourceStructure; datasourceId: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.datasourceId]: false,
      },
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
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.datasourceId]: false,
      },
      structure: {
        ...state.structure,
        [action.payload.datasourceId]: action.payload.data,
      },
    };
  },
  [ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR]: (
    state: DatasourceDataState,
    action: ReduxAction<{ datasourceId: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.datasourceId]: false,
      },
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
      environmentId: string;
      messages?: Array<string>;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error?: any;
    }>,
  ): DatasourceDataState => {
    if (action.payload.id) {
      const list = state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return {
            ...datasource,
            messages: action.payload.messages,
            datasourceStorages: {
              ...datasource.datasourceStorages,
              [action.payload.environmentId]: {
                ...datasource.datasourceStorages[action.payload.environmentId],
                toastMessage: ToastMessageType.TEST_DATASOURCE_SUCCESS,
              },
            },
          };
        }

        return datasource;
      });
      const unconfiguredList = state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return {
            ...datasource,
            messages: action.payload.messages,
            datasourceStorages: {
              ...datasource.datasourceStorages,
              [action.payload.environmentId]: {
                ...datasource.datasourceStorages[action.payload.environmentId],
                toastMessage: ToastMessageType.TEST_DATASOURCE_SUCCESS,
              },
            },
          };
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
      list: state.list.filter(
        (datasource) => datasource.id !== action.payload.id,
      ),
    };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_CANCELLED]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, isDeleting: false };
        }

        return datasource;
      }),
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
      isDatasourceBeingSaved: false,
      isDatasourceBeingSavedFromPopup: false,
      recentDatasources: [action.payload.id, ...state.recentDatasources],
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
      recentDatasources: [
        action.payload.id,
        ...state.recentDatasources.filter((ds) => ds !== action.payload.id),
      ],
    };
  },
  [ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN]: (
    state: DatasourceDataState,
    action: ReduxAction<{ datasourceId: string }>,
  ) => {
    return {
      ...state,
      loadingTokenForDatasourceId: action.payload.datasourceId,
    };
  },
  [ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN_SUCCESS]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      loadingTokenForDatasourceId: null,
    };
  },
  [ReduxActionErrorTypes.GET_OAUTH_ACCESS_TOKEN_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      loadingTokenForDatasourceId: null,
    };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_STORAGE_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<DatasourceStorage>,
  ): DatasourceDataState => {
    return {
      ...state,
      loading: false,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.datasourceId)
          return {
            ...datasource,
            datasourceStorages: {
              [`${action.payload.environmentId}`]: action.payload,
            },
          };

        return datasource;
      }),
      unconfiguredList: state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.datasourceId)
          return {
            ...datasource,
            datasourceStorages: {
              [`${action.payload.environmentId}`]: action.payload,
            },
          };

        return datasource;
      }),
      recentDatasources: [
        action.payload.datasourceId,
        ...state.recentDatasources.filter(
          (ds) => ds !== action.payload.datasourceId,
        ),
      ],
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
  [ReduxActionTypes.SAVE_DATASOURCE_NAME]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; name: string }>,
  ) => {
    const list = state.list.map((datasource) => {
      if (datasource.id === action.payload.id) {
        return { ...datasource, name: action.payload.name };
      }

      return datasource;
    });

    return {
      ...state,
      list: list,
    };
  },
  [ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ): DatasourceDataState => {
    return produce(state, (draftState) => {
      draftState.loading = false;
      draftState.list.forEach((datasource) => {
        if (datasource.id === action.payload.id) {
          assign(datasource, action.payload);
        }
      });
    });
  },
  [ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      loading: false,
      isDatasourceBeingSaved: false,
      isDatasourceBeingSavedFromPopup: false,
    };
  },
  [ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      list: state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return { ...datasource, isDeleting: false };
        }

        return datasource;
      }),
    };
  },
  [ReduxActionErrorTypes.TEST_DATASOURCE_ERROR]: (
    state: DatasourceDataState,
    action: ReduxAction<{
      show: boolean;
      id?: string;
      environmentId: string;
      messages?: Array<string>;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error?: any;
    }>,
  ): DatasourceDataState => {
    if (action.payload.id) {
      const list = state.list.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return {
            ...datasource,
            messages: action.payload.messages,
            datasourceStorages: {
              ...datasource.datasourceStorages,
              [action.payload.environmentId]: {
                ...datasource.datasourceStorages[action.payload.environmentId],
                toastMessage: ToastMessageType.TEST_DATASOURCE_ERROR,
              },
            },
          };
        }

        return datasource;
      });
      const unconfiguredList = state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload.id) {
          return {
            ...datasource,
            messages: action.payload.messages,
            datasourceStorages: {
              ...datasource.datasourceStorages,
              [action.payload.environmentId]: {
                ...datasource.datasourceStorages[action.payload.environmentId],
                toastMessage: ToastMessageType.TEST_DATASOURCE_ERROR,
              },
            },
          };
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
    action: ReduxAction<{ datasourceId: string }>,
  ) => {
    return {
      ...state,
      fetchingDatasourceStructure: {
        ...state.fetchingDatasourceStructure,
        [action.payload.datasourceId]: false,
      },
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
  [ReduxActionTypes.REMOVE_TEMP_DATASOURCE_SUCCESS]: (
    state: DatasourceDataState,
  ) => {
    return {
      ...state,
      isDeleting: false,
      list: state.list.filter(
        (datasource) => datasource.id !== TEMP_DATASOURCE_ID,
      ),
    };
  },
  [ReduxActionTypes.SET_DATASOURCE_SAVE_ACTION_FLAG]: (
    state: DatasourceDataState,
    action: ReduxAction<{ isDSSaved: boolean }>,
  ) => {
    return { ...state, isDatasourceBeingSaved: action.payload.isDSSaved };
  },
  [ReduxActionTypes.SET_DATASOURCE_SAVE_ACTION_FROM_POPUP_FLAG]: (
    state: DatasourceDataState,
    action: ReduxAction<{ isDSSavedFromPopup: boolean }>,
  ) => {
    return {
      ...state,
      isDatasourceBeingSavedFromPopup: action.payload.isDSSavedFromPopup,
    };
  },
  [ReduxActionTypes.SET_GSHEET_TOKEN]: (
    state: DatasourceDataState,
    action: ReduxAction<{ gsheetToken: string; gsheetProjectID: string }>,
  ) => {
    return {
      ...state,
      gsheetToken: action.payload.gsheetToken,
      gsheetProjectID: action.payload.gsheetProjectID,
    };
  },
  [ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS]: (
    state: DatasourceDataState,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.isFetchingSpreadsheets = true;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; data: DropdownOption[] }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.spreadsheets[action.payload.id] = {
        value: action.payload.data,
      };

      draftState.gsheetStructure.isFetchingSpreadsheets = false;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS_FAILURE]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; error: string }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.spreadsheets[action.payload.id] = {
        error: action.payload.error,
      };

      draftState.gsheetStructure.isFetchingSpreadsheets = false;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_SHEETS]: (state: DatasourceDataState) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.isFetchingSheets = true;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_SHEETS_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; data: DropdownOption[] }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.sheets[action.payload.id] = {
        value: action.payload.data,
      };
      draftState.gsheetStructure.isFetchingSheets = false;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_SHEETS_FAILURE]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; error: string }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.sheets[action.payload.id] = {
        error: action.payload.error,
      };
      draftState.gsheetStructure.isFetchingSheets = false;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_COLUMNS]: (state: DatasourceDataState) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.isFetchingColumns = true;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_COLUMNS_SUCCESS]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; data: DropdownOption[] }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.columns[action.payload.id] = {
        value: action.payload.data,
      };
      draftState.gsheetStructure.isFetchingColumns = false;
    });
  },
  [ReduxActionTypes.FETCH_GSHEET_COLUMNS_FAILURE]: (
    state: DatasourceDataState,
    action: ReduxAction<{ id: string; error: string }>,
  ) => {
    return produce(state, (draftState) => {
      draftState.gsheetStructure.columns[action.payload.id] = {
        error: action.payload.error,
      };
      draftState.gsheetStructure.isFetchingColumns = false;
    });
  },
  [ReduxActionTypes.RESET_DATASOURCE_BANNER_MESSAGE]: (
    state: DatasourceDataState,
    action: ReduxAction<string>,
  ) => {
    if (action.payload) {
      const list = state.list.map((datasource) => {
        if (datasource.id === action.payload) {
          Object.keys(datasource.datasourceStorages).map(
            (datasourceStorage) => {
              datasource.datasourceStorages[datasourceStorage].toastMessage =
                ToastMessageType.EMPTY_TOAST_MESSAGE;
            },
          );
        }

        return datasource;
      });
      const unconfiguredList = state.unconfiguredList.map((datasource) => {
        if (datasource.id === action.payload) {
          Object.keys(datasource.datasourceStorages).forEach(
            (datasourceStorage) => {
              datasource.datasourceStorages[datasourceStorage].toastMessage =
                ToastMessageType.EMPTY_TOAST_MESSAGE;
            },
          );
        }

        return datasource;
      });

      return {
        ...state,
        list: list,
        unconfiguredList: unconfiguredList,
      };
    }

    return {
      ...state,
    };
  },
});

export default datasourceReducer;
