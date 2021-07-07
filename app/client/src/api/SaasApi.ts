import Api from "./Api";
import { AxiosPromise } from "axios";
import { GenericApiResponse } from "api/ApiResponses";
import { Datasource } from "entities/Datasource";

class SaasApi extends Api {
  static url = "v1/saas";
  static getAppsmithToken(
    datasourceId: string,
    pageId: string,
  ): AxiosPromise<GenericApiResponse<string>> {
    return Api.post(`${SaasApi.url}/${datasourceId}/pages/${pageId}/oauth`);
  }

  static getAccessToken(
    datasourceId: string,
    token: string,
  ): AxiosPromise<GenericApiResponse<Datasource>> {
    return Api.post(
      `${SaasApi.url}/${datasourceId}/token?appsmithToken=${token}`,
    );
  }
}

export default SaasApi;
