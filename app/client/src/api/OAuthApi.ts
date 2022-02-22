import Api from "./Api";
import { AxiosPromise } from "axios";
import { ApiResponse } from "api/ApiResponses";
import { Datasource } from "entities/Datasource";

class OAuthApi extends Api {
  static url = "v1/saas";

  // Api endpoint to get "Appsmith token" from server
  static getAppsmithToken(
    datasourceId: string,
    pageId: string,
  ): AxiosPromise<ApiResponse<string>> {
    return Api.post(`${OAuthApi.url}/${datasourceId}/pages/${pageId}/oauth`);
  }

  // Api endpoint to get access token for datasource authorization
  static getAccessToken(
    datasourceId: string,
    token: string,
  ): AxiosPromise<ApiResponse<Datasource>> {
    return Api.post(
      `${OAuthApi.url}/${datasourceId}/token?appsmithToken=${token}`,
    );
  }
}

export default OAuthApi;
