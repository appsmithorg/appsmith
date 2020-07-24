import Api from "./Api";
import { AxiosPromise } from "axios";
import { PropertyPaneConfigsResponse } from "api/ConfigsApi";
import { LOGIN_SUBMIT_PATH } from "constants/ApiConstants";

class AuthApi extends Api {
  static baseURL = `v1/${LOGIN_SUBMIT_PATH}`;
  static formLogin(
    formData: string,
    redirectUri: string,
  ): AxiosPromise<PropertyPaneConfigsResponse> {
    return Api.post(AuthApi.baseURL, formData, undefined, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Redirect-Url": redirectUri,
        Accept: "text/html",
      },
      withCredentials: true,
    });
  }
}

export default AuthApi;
