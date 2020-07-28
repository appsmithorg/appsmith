import axios, { AxiosPromise } from "axios";
import { PropertyPaneConfigsResponse } from "api/ConfigsApi";
import { LOGIN_SUBMIT_PATH } from "constants/ApiConstants";

const loginAxios = axios.create({
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "text/html",
  },
  withCredentials: true,
});

class AuthApi {
  static baseURL = `/api/v1/${LOGIN_SUBMIT_PATH}`;
  static formLogin(
    formData: string,
    redirectUri = "",
  ): AxiosPromise<PropertyPaneConfigsResponse> {
    return loginAxios.post(AuthApi.baseURL, formData, {
      headers: {
        "X-Redirect-Url": redirectUri,
      },
    });
  }
}

export default AuthApi;
