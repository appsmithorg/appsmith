import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";

import type { InitCustomPluginApi } from "sagas/InitSagas";

class CustomPluginApi extends Api {
  static datasourceAPI = `v1/datasources/saas-integrations`;

  static async getDatasources(): Promise<
    AxiosPromise<ApiResponse<InitCustomPluginApi>>
  > {
    return Api.get(CustomPluginApi.datasourceAPI);
  }
}

export default CustomPluginApi;
