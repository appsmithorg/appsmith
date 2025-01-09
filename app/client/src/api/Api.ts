import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  apiRequestInterceptor,
  apiFailureResponseInterceptor,
  apiSuccessResponseInterceptor,
} from "./interceptors";
import { REQUEST_TIMEOUT_MS } from "ee/constants/ApiConstants";
import { convertObjectToQueryParams } from "utils/URLUtils";
import { startAndEndSpanForFn } from "instrumentation/generateTraces";
//
export const apiRequestConfig = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

const axiosInstance: AxiosInstance = axios.create();

axiosInstance.defaults.transformResponse = [
  function (...args) {
    const transformResponseAr = axios.defaults.transformResponse;

    // Pick up the transformFn from axios defaults and wrap it in with telemetry code so that we can capture how long it takes parse an api response
    if (Array.isArray(transformResponseAr) && transformResponseAr?.[0]) {
      const transfromFn = transformResponseAr?.[0];
      const resp = startAndEndSpanForFn(
        "axios.transformApiResponse",
        { url: this.url },
        () => transfromFn.call(this, ...args),
      );

      return resp;
    } else {
      // eslint-disable-next-line no-console
      console.error("could not find the api transformerFn");

      // return the data as it is.
      return args[0];
    }
  },
];

axiosInstance.interceptors.request.use(apiRequestInterceptor);

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
