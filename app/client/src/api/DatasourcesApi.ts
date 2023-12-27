import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import API from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise } from "axios";

import type { Datasource, DatasourceStorage } from "entities/Datasource";
export interface CreateDatasourceConfig {
  name: string;
  pluginId: string;
  type?: string;
  // key in the map representation of environment id of type string
  datasourceStorages: Record<string, DatasourceStorage>;
  //Passed for logging purposes.
  appName?: string;
}

export interface EmbeddedRestDatasourceRequest {
  datasourceConfiguration: { url: string };
  invalids: Array<string>;
  isValid: boolean;
  name: string;
  workspaceId: string;
  pluginId: string;
}

// type executeQueryData = Array<{ key?: string; value?: string }>;
type executeQueryData = Record<string, any>;

interface executeDatasourceQueryRequest {
  datasourceId: string;
  data?: executeQueryData;
}

class DatasourcesApi extends API {
  static url = "v1/datasources";

  static async fetchDatasources(
    workspaceId: string,
  ): Promise<AxiosPromise<ApiResponse<Datasource[]>>> {
    return API.get(DatasourcesApi.url + `?workspaceId=${workspaceId}`);
  }

  static async createDatasource(
    datasourceConfig: Partial<Datasource>,
  ): Promise<any> {
    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  // Api to test current environment datasource
  static async testDatasource(
    datasourceConfig: Partial<DatasourceStorage>,
    pluginId: string,
    workspaceId: string,
  ): Promise<any> {
    return API.post(
      `${DatasourcesApi.url}/test`,
      { ...datasourceConfig, pluginId, workspaceId },
      undefined,
      {
        timeout: DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS,
      },
    );
  }

  // Api to update datasource name.
  static async updateDatasource(
    datasourceConfig: Partial<Datasource>,
    id: string,
  ): Promise<any> {
    return API.put(DatasourcesApi.url + `/${id}`, datasourceConfig);
  }

  // Api to update specific datasource storage/environment configuration
  static async updateDatasourceStorage(
    datasourceConfig: Partial<DatasourceStorage>,
  ): Promise<any> {
    return API.put(
      DatasourcesApi.url + `/datasource-storages`,
      datasourceConfig,
    );
  }

  static async deleteDatasource(id: string): Promise<any> {
    return API.delete(DatasourcesApi.url + `/${id}`);
  }

  static async fetchDatasourceStructure(
    id: string,
    ignoreCache = false,
  ): Promise<any> {
    return API.get(
      DatasourcesApi.url + `/${id}/structure?ignoreCache=${ignoreCache}`,
    );
  }

  static async fetchMockDatasources(): Promise<
    AxiosPromise<ApiResponse<Datasource[]>>
  > {
    return API.get(DatasourcesApi.url + "/mocks");
  }

  static async addMockDbToDatasources(
    name: string,
    workspaceId: string,
    pluginId: string,
    packageName: string,
  ): Promise<any> {
    return API.post(DatasourcesApi.url + `/mocks`, {
      name,
      workspaceId,
      pluginId,
      packageName,
    });
  }

  static async executeDatasourceQuery({
    data,
    datasourceId,
  }: executeDatasourceQueryRequest) {
    return API.post(
      DatasourcesApi.url + `/${datasourceId}` + `/schema-preview`,
      data,
    );
  }

  static async executeGoogleSheetsDatasourceQuery({
    data,
    datasourceId,
  }: executeDatasourceQueryRequest) {
    return API.post(DatasourcesApi.url + `/${datasourceId}` + `/trigger`, data);
  }
}

export default DatasourcesApi;
