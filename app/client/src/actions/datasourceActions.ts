import type {
  ReduxAction,
  ReduxActionWithCallbacks,
} from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { CreateDatasourceConfig } from "api/DatasourcesApi";
import type {
  AuthenticationStatus,
  Datasource,
  DatasourceStructureContext,
  FilePickerActionStatus,
  MockDatasource,
} from "entities/Datasource";
import type { PluginType } from "entities/Action";
import type { ApiResponse, ResponseMeta } from "api/ApiResponses";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import {
  ActionParentEntityType,
  type ActionParentEntityTypeInterface,
} from "ee/entities/Engine/actionHelpers";

export const createDatasourceFromForm = (
  payload: CreateDatasourceConfig & Datasource,
  onSuccess?: ReduxAction<unknown>,
  onError?: ReduxAction<unknown>,
) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
    payload,
    onSuccess,
    onError,
  };
};

export const createTempDatasourceFromForm = (payload: {
  pluginId: string;
  type: PluginType;
}) => {
  return {
    type: ReduxActionTypes.CREATE_TEMP_DATASOURCE_FROM_FORM_SUCCESS,
    payload,
  };
};

export const updateDatasource = (
  payload: Datasource,
  currEditingEnvId: string,
  onSuccess?: ReduxAction<unknown>,
  onError?: ReduxAction<unknown>,
  isInsideReconnectModal?: boolean,
): ReduxActionWithCallbacks<
  Datasource & { isInsideReconnectModal: boolean; currEditingEnvId?: string },
  unknown,
  unknown
> => {
  return {
    type: ReduxActionTypes.UPDATE_DATASOURCE_INIT,
    payload: {
      ...payload,
      isInsideReconnectModal: !!isInsideReconnectModal,
      currEditingEnvId,
    },
    onSuccess,
    onError,
  };
};

export interface UpdateDatasourceSuccessAction {
  type: string;
  payload: Datasource;
  redirect: boolean;
  queryParams?: Record<string, string>;
}

export interface CreateDatasourceSuccessAction {
  type: string;
  payload: Datasource;
  isDBCreated: boolean;
  redirect: boolean;
}

export const updateDatasourceSuccess = (
  payload: Datasource,
  redirect = true,
  queryParams = {},
): UpdateDatasourceSuccessAction => ({
  type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
  payload,
  redirect,
  queryParams,
});

export const createDatasourceSuccess = (
  payload: Datasource,
  isDBCreated = false,
  redirect = false,
): CreateDatasourceSuccessAction => ({
  type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
  payload,
  isDBCreated,
  redirect,
});

export const redirectAuthorizationCode = (
  contextId: string,
  datasourceId: string,
  pluginType: PluginType,
  contextType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  return {
    type: ReduxActionTypes.REDIRECT_AUTHORIZATION_CODE,
    payload: {
      contextId,
      contextType,
      datasourceId,
      pluginType,
    },
  };
};

export const fetchDatasourceStructure = (
  id: string,
  ignoreCache?: boolean,
  schemaFetchContext?: DatasourceStructureContext,
) => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
    payload: {
      id,
      ignoreCache,
      schemaFetchContext,
    },
  };
};

export const addAndFetchMockDatasourceStructure = (
  datasource: MockDatasource,
) => {
  return {
    type: ReduxActionTypes.ADD_AND_FETCH_MOCK_DATASOURCE_STRUCTURE_INIT,
    payload: datasource,
  };
};

export const fetchGheetSpreadsheets = (payload: {
  datasourceId: string;
  pluginId: string;
}) => ({
  type: ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS,
  payload,
});

export const fetchGheetSheets = (payload: {
  datasourceId: string;
  pluginId: string;
  sheetUrl: string;
}) => ({
  type: ReduxActionTypes.FETCH_GSHEET_SHEETS,
  payload,
});

export const fetchGheetColumns = (payload: {
  datasourceId: string;
  pluginId: string;
  sheetName: string;
  sheetUrl: string;
  headerIndex: number;
}) => ({
  type: ReduxActionTypes.FETCH_GSHEET_COLUMNS,
  payload,
});

export const expandDatasourceEntity = (id: string) => {
  return {
    type: ReduxActionTypes.EXPAND_DATASOURCE_ENTITY,
    payload: id,
  };
};

export const refreshDatasourceStructure = (
  id: string,
  schemaRefreshContext?: DatasourceStructureContext,
) => {
  return {
    type: ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
    payload: {
      id,
      schemaRefreshContext,
    },
  };
};

export const saveDatasourceName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_DATASOURCE_NAME,
  payload: payload,
});

export const updateDatasourceName = (payload: {
  id: string;
  name: string;
}) => ({
  type: ReduxActionTypes.UPDATE_DATASOURCE_NAME,
  payload: payload,
});

export const changeDatasource = (payload: {
  datasource?: Datasource;
  shouldNotRedirect?: boolean;
}) => {
  return {
    type: ReduxActionTypes.CHANGE_DATASOURCE,
    payload,
  };
};

export const switchDatasource = (id: string, shouldNotRedirect: boolean) => {
  return {
    type: ReduxActionTypes.SWITCH_DATASOURCE,
    payload: {
      datasourceId: id,
      shouldNotRedirect,
    },
  };
};

export const testDatasource = (payload: Partial<Datasource>) => {
  return {
    type: ReduxActionTypes.TEST_DATASOURCE_INIT,
    payload,
  };
};

export const deleteDatasource = (
  payload: Partial<Datasource>,
  onSuccess?: ReduxAction<unknown>,
  onError?: ReduxAction<unknown>,
  onSuccessCallback?: () => void,
): ReduxActionWithCallbacks<Partial<Datasource>, unknown, unknown> => {
  return {
    type: ReduxActionTypes.DELETE_DATASOURCE_INIT,
    payload,
    onSuccess,
    onError,
    onSuccessCallback,
  };
};

// sets viewMode flag along with clearing the datasource banner message
export const setDatasourceViewMode = (payload: {
  datasourceId: string;
  viewMode: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE,
    payload,
  };
};

// sets viewMode flag
export const setDatasourceViewModeFlag = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE_FLAG,
    payload,
  };
};

export const setAllDatasourceCollapsible = (payload: {
  [key: string]: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_ALL_DATASOURCE_COLLAPSIBLE_STATE,
    payload,
  };
};

export const setDatasourceCollapsible = (key: string, isOpen: boolean) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_COLLAPSIBLE_STATE,
    payload: { key, isOpen },
  };
};

export const fetchDatasources = (payload?: {
  workspaceId?: string;
  datasources?: ApiResponse<Datasource[]>;
}) => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
    payload,
  };
};

export const fetchMockDatasources = (mockDatasources?: ApiResponse) => {
  return {
    type: ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT,
    payload: { mockDatasources },
  };
};

export interface addMockRequest
  extends ReduxAction<{
    name: string;
    workspaceId: string;
    pluginId: string;
    packageName: string;
    isGeneratePageMode?: string;
    skipRedirection?: boolean;
  }> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: any;
}

export const addMockDatasourceToWorkspace = (
  name: string,
  workspaceId: string,
  pluginId: string,
  packageName: string,
  isGeneratePageMode?: string,
  skipRedirection = false,
): addMockRequest => {
  return {
    type: ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT,
    payload: { name, packageName, pluginId, workspaceId, skipRedirection },
    extraParams: { isGeneratePageMode },
  };
};

export const storeAsDatasource = () => {
  return {
    type: ReduxActionTypes.STORE_AS_DATASOURCE_INIT,
  };
};

export const getOAuthAccessToken = (datasourceId: string) => {
  return {
    type: ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN,
    payload: { datasourceId },
  };
};

export interface executeDatasourceQuerySuccessPayload<T> {
  responseMeta: ResponseMeta;
  data: {
    body: T;
    trigger?: T;
    headers: Record<string, string[]>;
    statusCode: string;
    isExecutionSuccess: boolean;
  };
}
type errorPayload = string;

export interface executeDatasourceReduxActionPayload {
  datasourceId: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template?: Record<string, any>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  isGeneratePage: boolean;
}

export type executeDatasourceQueryReduxAction<T> = ReduxActionWithCallbacks<
  executeDatasourceReduxActionPayload,
  executeDatasourceQuerySuccessPayload<T>,
  errorPayload
>;

export const executeDatasourceQuery = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: {
  onErrorCallback?: (payload: errorPayload) => void;
  onSuccessCallback?: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: executeDatasourceQuerySuccessPayload<any>,
  ) => void;
  payload: executeDatasourceReduxActionPayload;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): executeDatasourceQueryReduxAction<any> => {
  return {
    type: ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_INIT,
    payload,
    onErrorCallback,
    onSuccessCallback,
  };
};

export const setUnconfiguredDatasourcesDuringImport = (
  payload?: Array<Datasource>,
) => ({
  type: ReduxActionTypes.SET_UNCONFIGURED_DATASOURCES,
  payload,
});

export const removeTempDatasource = () => {
  return {
    type: ReduxActionTypes.REMOVE_TEMP_DATASOURCE_SUCCESS,
  };
};

export const deleteTempDSFromDraft = () => {
  return {
    type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
    payload: {
      id: TEMP_DATASOURCE_ID,
    },
  };
};

export const toggleSaveActionFlag = (isDSSaved: boolean) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_SAVE_ACTION_FLAG,
    payload: {
      isDSSaved: isDSSaved,
    },
  };
};

export const toggleSaveActionFromPopupFlag = (isDSSavedFromPopup: boolean) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_SAVE_ACTION_FROM_POPUP_FLAG,
    payload: {
      isDSSavedFromPopup: isDSSavedFromPopup,
    },
  };
};

// This function stores the config property for key value pairs in
// datasource form which are initialized by default
export const setDefaultKeyValPairFlag = (defaultKeyValArrayConfig: string) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_DEFAULT_KEY_VALUE_PAIR_SET,
    payload: defaultKeyValArrayConfig,
  };
};

// This function resets the config property stored in redux for key value pairs in
// datasource form which are initialized by default, once these key value pairs are initialized
// in the datasource config form, store needs to reset those values
export const resetDefaultKeyValPairFlag = () => {
  return {
    type: ReduxActionTypes.RESET_DATASOURCE_DEFAULT_KEY_VALUE_PAIR_SET,
    payload: [],
  };
};

export const initializeDatasourceFormDefaults = (pluginType: string) => {
  return {
    type: ReduxActionTypes.INITIALIZE_DATASOURCE_FORM_WITH_DEFAULTS,
    payload: {
      pluginType: pluginType,
    },
  };
};

// In case of access to specific sheets in google sheet datasource, this action
// is used for handling file picker callback, when user selects files/cancels the selection
// this callback action will be triggered
export const filePickerCallbackAction = (data: {
  action: FilePickerActionStatus;
  datasourceId: string;
  fileIds: Array<string>;
}) => {
  return {
    type: ReduxActionTypes.FILE_PICKER_CALLBACK_ACTION,
    payload: data,
  };
};

// This action triggers google sheet file picker to load on blank page
export const loadFilePickerAction = () => {
  return {
    type: ReduxActionTypes.LOAD_FILE_PICKER_ACTION,
  };
};

// updates google sheet datasource auth state, in case of selected sheets
export const updateDatasourceAuthState = (
  datasource: Datasource,
  authStatus: AuthenticationStatus,
) => {
  return {
    type: ReduxActionTypes.UPDATE_DATASOURCE_AUTH_STATE,
    payload: {
      datasource: datasource,
      authStatus: authStatus,
    },
  };
};

export const datasourceDiscardAction = (pluginId: string) => {
  return {
    type: ReduxActionTypes.DATASOURCE_DISCARD_ACTION,
    payload: {
      pluginId: pluginId,
    },
  };
};

export const softRefreshDatasourceStructure = () => ({
  type: ReduxActionTypes.SOFT_REFRESH_DATASOURCE_STRUCTURE,
});

export const setDatasourcePreviewSelectedTableName = (
  selectedTableName: string,
) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_PREVIEW_SELECTED_TABLE_NAME,
    payload: {
      selectedTableName: selectedTableName,
    },
  };
};

export default {
  fetchDatasources,
};
