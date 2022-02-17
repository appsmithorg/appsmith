import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import API from "api/Api";
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

type executeQueryData = Array<{ key?: string; value?: string }>;

export interface executeDatasourceQueryRequest {
  datasourceId: string;
  data: executeQueryData;
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

  static fetchMockDatasources(): AxiosPromise<
    GenericApiResponse<Datasource[]>
  > {
    return API.get(DatasourcesApi.url + "/mocks");
  }

  static addMockDbToDatasources(
    name: string,
    organizationId: string,
    pluginId: string,
    packageName: string,
  ): Promise<any> {
    return API.post(DatasourcesApi.url + `/mocks`, {
      name,
      organizationId,
      pluginId,
      packageName,
    });
  }

  static executeDatasourceQuery({
    data,
    datasourceId,
  }: executeDatasourceQueryRequest) {
    return API.put(
      DatasourcesApi.url + `/datasource-query` + `/${datasourceId}`,
      data,
    );
  }
}

export default DatasourcesApi;
