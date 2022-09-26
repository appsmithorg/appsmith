import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
} from "@appsmith/constants/ReduxActionConstants";
import { CreateDatasourceConfig } from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";
import { PluginType } from "entities/Action";
import { executeDatasourceQueryRequest } from "api/DatasourcesApi";
import { ResponseMeta } from "api/ApiResponses";

export const createDatasourceFromForm = (payload: CreateDatasourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
    payload,
  };
};

export const updateDatasource = (
  payload: Datasource,
  onSuccess?: ReduxAction<unknown>,
  onError?: ReduxAction<unknown>,
): ReduxActionWithCallbacks<Datasource, unknown, unknown> => {
  return {
    type: ReduxActionTypes.UPDATE_DATASOURCE_INIT,
    payload,
    onSuccess,
    onError,
  };
};

export type UpdateDatasourceSuccessAction = {
  type: string;
  payload: Datasource;
  redirect: boolean;
  queryParams?: Record<string, string>;
};

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

export const redirectAuthorizationCode = (
  pageId: string,
  datasourceId: string,
  pluginType: PluginType,
) => {
  return {
    type: ReduxActionTypes.REDIRECT_AUTHORIZATION_CODE,
    payload: {
      pageId,
      datasourceId,
      pluginType,
    },
  };
};

export const fetchDatasourceStructure = (id: string, ignoreCache?: boolean) => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
    payload: {
      id,
      ignoreCache,
    },
  };
};

export const expandDatasourceEntity = (id: string) => {
  return {
    type: ReduxActionTypes.EXPAND_DATASOURCE_ENTITY,
    payload: id,
  };
};

export const refreshDatasourceStructure = (id: string) => {
  return {
    type: ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
    payload: {
      id,
    },
  };
};

export const saveDatasourceName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_DATASOURCE_NAME,
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

export const setDatsourceEditorMode = (payload: {
  id: string;
  viewMode: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE,
    payload,
  };
};

export const fetchDatasources = (payload?: { workspaceId?: string }) => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
    payload,
  };
};

export const fetchMockDatasources = () => {
  return {
    type: ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT,
  };
};

export interface addMockRequest
  extends ReduxAction<{
    name: string;
    workspaceId: string;
    pluginId: string;
    packageName: string;
    isGeneratePageMode?: string;
  }> {
  extraParams?: any;
}

export const addMockDatasourceToWorkspace = (
  name: string,
  workspaceId: string,
  pluginId: string,
  packageName: string,
  isGeneratePageMode?: string,
): addMockRequest => {
  return {
    type: ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT,
    payload: { name, packageName, pluginId, workspaceId },
    extraParams: { isGeneratePageMode },
  };
};

export const initDatasourcePane = (
  pluginType: string,
  urlId?: string,
): ReduxAction<{ pluginType: string; id?: string }> => {
  return {
    type: ReduxActionTypes.INIT_DATASOURCE_PANE,
    payload: { id: urlId, pluginType },
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

export type executeDatasourceQuerySuccessPayload<T> = {
  responseMeta: ResponseMeta;
  data: {
    body: T;
    trigger: T;
    headers: Record<string, string[]>;
    statusCode: string;
    isExecutionSuccess: boolean;
  };
};
type errorPayload = string;

export type executeDatasourceQueryReduxAction<T> = ReduxActionWithCallbacks<
  executeDatasourceQueryRequest,
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
    payload: executeDatasourceQuerySuccessPayload<any>,
  ) => void;
  payload: executeDatasourceQueryRequest;
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

export default {
  fetchDatasources,
  initDatasourcePane,
};
