import API from "./Api";
import { GenericApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";
import { EXECUTE_ACTION_TIMEOUT_MS } from "constants/ApiConstants";

interface DatasourceAuthentication {
  authType?: string;
  username?: string;
  password?: string;
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
    headers?: Record<string, string>;
    databaseName?: string;
  };
  invalids: string[];
  isValid: boolean;
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

  static fetchDatasources(): AxiosPromise<GenericApiResponse<Datasource[]>> {
    return API.get(DatasourcesApi.url);
  }

  static createDatasource(datasourceConfig: Partial<Datasource>): Promise<{}> {
    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  static testDatasource(datasourceConfig: Partial<Datasource>): Promise<{}> {
    return API.post(`${DatasourcesApi.url}/test`, datasourceConfig, undefined, {
      timeout: EXECUTE_ACTION_TIMEOUT_MS,
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
}

export default DatasourcesApi;
