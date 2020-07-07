import _ from "lodash";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { getAppsmithConfigs } from "configs";
import {
  REQUEST_TIMEOUT_MS,
  API_REQUEST_HEADERS,
} from "constants/ApiConstants";
import { ActionApiResponse } from "./ActionAPI";
import { AUTH_LOGIN_URL, PAGE_NOT_FOUND_URL } from "constants/routes";
import { setRouteBeforeLogin } from "utils/storage";
import history from "utils/history";
const { apiUrl, baseUrl } = getAppsmithConfigs();

//TODO(abhinav): Refactor this to make more composable.
export const apiRequestConfig = {
  baseURL: baseUrl + apiUrl,
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
      if (error.response.status === 401) {
        if (!/^\/user\/\w+/.test(window.location.pathname)) {
          setRouteBeforeLogin(window.location.pathname);
          history.push(AUTH_LOGIN_URL);
          return Promise.reject({
            code: 401,
            message: "Unauthorized. Redirecting to login page...",
            show: false,
          });
        }
      }
      if (
        error.resonse.status === 404 &&
        error.response.app_error_code === 4028
      ) {
        history.push(PAGE_NOT_FOUND_URL);
        return Promise.reject({
          code: 404,
          message: "Page Not Found",
          show: false,
        });
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
