import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { REQUEST_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import { convertObjectToQueryParams } from "utils/URLUtils";
import {
  apiFailureResponseInterceptor,
  apiRequestInterceptor,
  apiSuccessResponseInterceptor,
} from "api/ApiUtils";

//TODO(abhinav): Refactor this to make more composable.
export const apiRequestConfig = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

const axiosInstance: AxiosInstance = axios.create();

axiosInstance.interceptors.request.use(apiRequestInterceptor);
axiosInstance.interceptors.response.use(
  apiSuccessResponseInterceptor,
  apiFailureResponseInterceptor,
);

class Api {
  static get(url: string, queryParams?: any, config: AxiosRequestConfig = {}) {
    return axiosInstance.get(url + convertObjectToQueryParams(queryParams), {
      ...apiRequestConfig,
      ...config,
    });
  }

  static post(
    url: string,
    body?: any,
    queryParams?: any,
    config: AxiosRequestConfig = {},
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
    config: AxiosRequestConfig = {},
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

  static patch(
    url: string,
    body?: any,
    queryParams?: any,
    config: AxiosRequestConfig = {},
  ) {
    return axiosInstance.patch(
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
    config: AxiosRequestConfig = {},
  ) {
    return axiosInstance.delete(url + convertObjectToQueryParams(queryParams), {
      ...apiRequestConfig,
      ...config,
    });
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default Api;
