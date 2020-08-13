import _ from "lodash";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  REQUEST_TIMEOUT_MS,
  API_REQUEST_HEADERS,
} from "constants/ApiConstants";
import { ActionApiResponse } from "./ActionAPI";
import { AUTH_LOGIN_URL, PAGE_NOT_FOUND_URL } from "constants/routes";
import history from "utils/history";

//TODO(abhinav): Refactor this to make more composable.
export const apiRequestConfig = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: API_REQUEST_HEADERS,
  withCredentials: true,
};

const axiosInstance: AxiosInstance = axios.create();

const executeActionRegex = /actions\/execute/;
axiosInstance.interceptors.request.use((config: any) => {
  return { ...config, timer: performance.now() };
});

const makeExecuteActionResponse = (response: any): ActionApiResponse => ({
  ...response.data,
  clientMeta: {
    size: response.headers["content-length"],
    duration: Number(performance.now() - response.config.timer).toFixed(),
  },
});

const is404orAuthPath = () => {
  const pathName = window.location.pathname;
  return /^\/404/.test(pathName) || /^\/user\/\w+/.test(pathName);
};

axiosInstance.interceptors.response.use(
  (response: any): any => {
    if (response.config.url.match(executeActionRegex)) {
      return makeExecuteActionResponse(response);
    }
    // Do something with response data
    return response.data;
  },
  function(error: any) {
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        message: "Please check your internet connection",
      });
    }
    if (error.config.url.match(executeActionRegex)) {
      return makeExecuteActionResponse(error.response);
    }
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.log(error.response.data);
      // console.log(error.response.status);
      // console.log(error.response.headers);
      if (!is404orAuthPath()) {
        const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
        if (error.response.status === 401) {
          // Redirect to login and set a redirect url.
          history.replace({
            pathname: AUTH_LOGIN_URL,
            search: `redirectTo=${currentUrl}`,
          });
          return Promise.reject({
            code: 401,
            message: "Unauthorized. Redirecting to login page...",
            show: false,
          });
        }
        const errorData = error.response.data.responseMeta;
        if (errorData.status === 404 && errorData.error.code === 4028) {
          history.replace({
            pathname: PAGE_NOT_FOUND_URL,
            search: `redirectTo=${currentUrl}`,
          });
          return Promise.reject({
            code: 404,
            message: "Resource Not Found",
            show: false,
          });
        }
      }
      if (error.response.data.responseMeta) {
        return Promise.resolve(error.response.data);
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error", error.message);
    }
    console.log(error.config);
    return Promise.resolve(error);
  },
);

class Api {
  static get(
    url: string,
    queryParams?: any,
    config?: Partial<AxiosRequestConfig>,
  ) {
    return axiosInstance.get(
      url + this.convertObjectToQueryParams(queryParams),
      _.merge(apiRequestConfig, config),
    );
  }

  static post(
    url: string,
    body?: any,
    queryParams?: any,
    config?: Partial<AxiosRequestConfig>,
  ) {
    return axiosInstance.post(
      url + this.convertObjectToQueryParams(queryParams),
      body,
      _.merge(apiRequestConfig, config),
    );
  }

  static put(
    url: string,
    body?: any,
    queryParams?: any,
    config?: Partial<AxiosRequestConfig>,
  ) {
    return axiosInstance.put(
      url + this.convertObjectToQueryParams(queryParams),
      body,
      _.merge(apiRequestConfig, config),
    );
  }

  static delete(
    url: string,
    queryParams?: any,
    config?: Partial<AxiosRequestConfig>,
  ) {
    return axiosInstance.delete(
      url + this.convertObjectToQueryParams(queryParams),
      _.merge(apiRequestConfig, config),
    );
  }

  static convertObjectToQueryParams(object: any): string {
    if (!_.isNil(object)) {
      const paramArray: string[] = _.map(_.keys(object), key => {
        return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]);
      });
      return "?" + _.join(paramArray, "&");
    } else {
      return "";
    }
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export default Api;
