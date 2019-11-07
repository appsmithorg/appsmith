import API from "./Api";
import { GenericApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";

interface DatasourceAuthentication {
  authType: string;
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
}

export interface CreateDatasourceConfig {
  name: string;
  pluginId: string;
  datasourceConfiguration: {
    url: string;
  };
}

class DatasourcesApi extends API {
  static url = "v1/datasources";

  static fetchDatasources(): AxiosPromise<GenericApiResponse<Datasource[]>> {
    return API.get(DatasourcesApi.url);
  }

  static createDatasource(datasourceConfig: Partial<Datasource>): Promise<{}> {
    return API.post(DatasourcesApi.url, datasourceConfig);
  }
}

export default DatasourcesApi;
