import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { REQUEST_TIMEOUT_MS } from "constants/ApiConstants";
import { convertObjectToQueryParams } from "utils/AppsmithUtils";
import {
  apiFailureResponseInterceptor,
  apiRequestInterceptor,
  apiSuccessResponseInterceptor,
} from "api/ApiUtils";
import { API_REQUEST_HEADERS } from "constants/AppsmithActionConstants/ActionConstants";

//TODO(abhinav): Refactor this to make more composable.
export const apiRequestConfig = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: API_REQUEST_HEADERS,
  withCredentials: true,
};

const axiosInstance: AxiosInstance = axios.create();

axiosInstance.interceptors.request.use(apiRequestInterceptor);
axiosInstance.interceptors.response.use(
  apiSuccessResponseInterceptor,
  apiFailureResponseInterceptor,
);

class Api {
  static get(
    url: string,
    queryParams?: any,
    config: Partial<AxiosRequestConfig> = {},
  ) {
    return axiosInstance.get(url + convertObjectToQueryParams(queryParams), {
      ...apiRequestConfig,
      ...config,
    });
  }

  static post(
    url: string,
    body?: any,
    queryParams?: any,
    config: Partial<AxiosRequestConfig> = {},
  ) {
    return axiosInstance.post(
      url + convertObjectToQueryParams(queryParams),
      body,
      {
        ...apiRequestConfig,
        ...config,
      },
    );
  }

  static put(
    url: string,
    body?: any,
    queryParams?: any,
    config: Partial<AxiosRequestConfig> = {},
  ) {
    return axiosInstance.put(
      url + convertObjectToQueryParams(queryParams),
      body,
      {
        ...apiRequestConfig,
        ...config,
      },
    );
  }

  static delete(
    url: string,
    queryParams?: any,
    config: Partial<AxiosRequestConfig> = {},
  ) {
    return axiosInstance.delete(url + convertObjectToQueryParams(queryParams), {
      ...apiRequestConfig,
      ...config,
    });
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export default Api;
