import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";
import type { Datasource } from "entities/Datasource";

class SaasApi extends Api {
  static url = "v1/saas";
  static async getAppsmithToken(
    datasourceId: string,
    pageId: string,
  ): Promise<AxiosPromise<ApiResponse<string>>> {
    return Api.post(`${SaasApi.url}/${datasourceId}/pages/${pageId}/oauth`);
  }

  static async getAccessToken(
    datasourceId: string,
    token: string,
  ): Promise<AxiosPromise<ApiResponse<Datasource>>> {
    return Api.post(
      `${SaasApi.url}/${datasourceId}/token?appsmithToken=${token}`,
    );
  }
}

export default SaasApi;
