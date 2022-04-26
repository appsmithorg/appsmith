export * from "ce/api/UserApi";
import { UserApi as CE_UserApi } from "ce/api/UserApi";
import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "api/ApiResponses";
export interface FetchSamlMetadataPayload {
  isEnabled: boolean;
  importFromUrl?: string;
  importFromXml?: string;
  configuration?: {
    singleSignOnServiceUrl: string;
    signingCertificate: string;
    emailField: string;
  };
}

class UserApi extends CE_UserApi {
  static fetchSamlMetadataURL = "/v1/admin/sso/saml";

  static fetchSamlMetadata(
    payload: FetchSamlMetadataPayload,
  ): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.fetchSamlMetadataURL, payload);
  }
}

export default UserApi;
