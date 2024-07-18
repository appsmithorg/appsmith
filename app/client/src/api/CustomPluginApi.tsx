import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";

import type { InitCustomPluginApi } from "sagas/InitSagas";

class CustomPluginApi extends Api {
  static url = "https://fzejayitdypdfoymelov.supabase.co/rest/v1";
  static datasourceAPI = `${CustomPluginApi.url}/saas_datasources`;
  static apiListFromDatasourceAPI = `${CustomPluginApi.url}/saas_apis`;
  static customHeaders = {
    "Content-type": "application/json",
    apikey: "apikey",
  };

  static async getDatasources(): Promise<
    AxiosPromise<ApiResponse<InitCustomPluginApi>>
  > {
    return Api.get(CustomPluginApi.datasourceAPI, undefined, {
      headers: CustomPluginApi.customHeaders,
    });
  }
}

export default CustomPluginApi;
