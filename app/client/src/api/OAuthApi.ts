import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";
import type { Datasource } from "entities/Datasource";

class OAuthApi extends Api {
  static url = "v1/saas";

  // Api endpoint to get "Appsmith token" from server
  static getAppsmithToken(
    datasourceId: string,
    pageId: string,
    isImport?: boolean,
  ): AxiosPromise<ApiResponse<string>> {
    const isImportQuery = isImport ? "?importForGit=true" : "";
    return Api.post(
      `${OAuthApi.url}/${datasourceId}/pages/${pageId}/oauth${isImportQuery}`,
    );
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

  static redirectUrl(
    datasourceId: string,
    pageId: string,
    // currentEditingEnvironemntId: string,
  ): AxiosPromise<ApiResponse<Datasource>> {
    return Api.get(
      `v1/datasources/${datasourceId}/pages/${pageId}/code`,
      null,
      {
        // transformRequest: (data: any, headers: any) => {
        //   delete headers["Environmentid"];
        //   headers["Environmentid"] = currentEditingEnvironemntId;
        //   return data;
        // },
        // headers: {
        //   Environmentid: currentEditingEnvironemntId,
        // },
      },
    );
  }
}

export default OAuthApi;
