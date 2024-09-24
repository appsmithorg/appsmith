import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import { REQUEST_TIMEOUT_MS } from "ee/constants/ApiConstants";
import { convertObjectToQueryParams } from "utils/URLUtils";
import {
  apiFailureResponseInterceptor,
  apiRequestInterceptor,
  apiSuccessResponseInterceptor,
  blockedApiRoutesForAirgapInterceptor,
} from "ee/api/ApiUtils";

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

const requestInterceptors = [
  blockedApiRoutesForAirgapInterceptor,
  apiRequestInterceptor,
];

requestInterceptors.forEach((interceptor) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axiosInstance.interceptors.request.use(interceptor as any);
});

axiosInstance.interceptors.response.use(
  apiSuccessResponseInterceptor,
  apiFailureResponseInterceptor,
);

class Api {
  static async get(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryParams?: any,
    config: AxiosRequestConfig = {},
  ) {
    return axiosInstance.get(url + convertObjectToQueryParams(queryParams), {
      ...apiRequestConfig,
      ...config,
    });
  }

  static async post(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static async put(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static async patch(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static async delete(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
