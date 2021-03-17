import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "constants/ApiConstants";
import API from "./Api";
import { GenericApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";

import { DatasourceAuthentication, Datasource } from "entities/Datasource";
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

export interface EmbeddedRestDatasourceRequest {
  datasourceConfiguration: { url: string };
  invalids: Array<string>;
  isValid: boolean;
  name: string;
  organizationId: string;
  pluginId: string;
}

class DatasourcesApi extends API {
  static url = "v1/datasources";

  static fetchDatasources(
    orgId: string,
  ): AxiosPromise<GenericApiResponse<Datasource[]>> {
    return API.get(DatasourcesApi.url + `?organizationId=${orgId}`);
  }

  static createDatasource(datasourceConfig: Partial<Datasource>): Promise<any> {
    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  static testDatasource(datasourceConfig: Partial<Datasource>): Promise<any> {
    return API.post(`${DatasourcesApi.url}/test`, datasourceConfig, undefined, {
      timeout: DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS,
    });
  }

  static updateDatasource(
    datasourceConfig: Partial<Datasource>,
    id: string,
  ): Promise<any> {
    return API.put(DatasourcesApi.url + `/${id}`, datasourceConfig);
  }

  static deleteDatasource(id: string): Promise<any> {
    return API.delete(DatasourcesApi.url + `/${id}`);
  }

  static fetchDatasourceStructure(
    id: string,
    ignoreCache = false,
  ): Promise<any> {
    return API.get(
      DatasourcesApi.url + `/${id}/structure?ignoreCache=${ignoreCache}`,
    );
  }
}

export default DatasourcesApi;
