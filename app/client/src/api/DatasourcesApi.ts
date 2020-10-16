import API from "./Api";
import { GenericApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";
import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "constants/ApiConstants";
import { Property } from "entities/Action";

interface DatasourceAuthentication {
  authType?: string;
  username?: string;
  password?: string;
}

export interface QueryTemplate {
  title: string;
  body: string;
}

export interface DatasourceColumns {
  name: string;
  type: string;
}

export interface DatasourceKeys {
  name: string;
  type: string;
}

export interface DatasourceTable {
  type: string;
  name: string;
  columns: DatasourceColumns[];
  keys: DatasourceKeys[];
  templates: QueryTemplate[];
}

export interface DatasourceStructure {
  tables?: DatasourceTable[];
}

export interface Datasource {
  id: string;
  name: string;
  pluginId: string;
  organizationId?: string;
  datasourceConfiguration: {
    url: string;
    authentication?: DatasourceAuthentication;
    properties?: Record<string, string>;
    headers?: Property[];
    databaseName?: string;
  };
  invalids?: string[];
  isValid?: boolean;
  structure?: DatasourceStructure;
}

export interface CreateDatasourceConfig {
  name: string;
  pluginId: string;
  datasourceConfiguration: {
    url: string;
    databaseName?: string;
    authentication?: DatasourceAuthentication;
  };
  //Passed for logging purposes.
  appName?: string;
}

class DatasourcesApi extends API {
  static url = "v1/datasources";

  static fetchDatasources(
    orgId: string,
  ): AxiosPromise<GenericApiResponse<Datasource[]>> {
    return API.get(DatasourcesApi.url + `?organizationId=${orgId}`);
  }

  static createDatasource(datasourceConfig: Partial<Datasource>): Promise<{}> {
    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  static testDatasource(datasourceConfig: Partial<Datasource>): Promise<{}> {
    return API.post(`${DatasourcesApi.url}/test`, datasourceConfig, undefined, {
      timeout: DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS,
    });
  }

  static updateDatasource(
    datasourceConfig: Partial<Datasource>,
    id: string,
  ): Promise<{}> {
    return API.put(DatasourcesApi.url + `/${id}`, datasourceConfig);
  }

  static deleteDatasource(id: string): Promise<{}> {
    return API.delete(DatasourcesApi.url + `/${id}`);
  }

  static fetchDatasourceStructure(
    id: string,
    ignoreCache = false,
  ): Promise<{}> {
    return API.get(
      DatasourcesApi.url + `/${id}/structure?ignoreCache=${ignoreCache}`,
    );
  }
}

export default DatasourcesApi;
