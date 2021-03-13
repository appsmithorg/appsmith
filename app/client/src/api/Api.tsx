import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  REQUEST_TIMEOUT_MS,
  API_REQUEST_HEADERS,
  API_STATUS_CODES,
  ERROR_CODES,
  SERVER_ERROR_CODES,
} from "constants/ApiConstants";
import { ActionApiResponse } from "./ActionAPI";
import { AUTH_LOGIN_URL } from "constants/routes";
import history from "utils/history";
import { convertObjectToQueryParams } from "utils/AppsmithUtils";
import {
  createMessage,
  ERROR_0,
  ERROR_500,
  SERVER_API_TIMEOUT_ERROR,
} from "../constants/messages";
import log from "loglevel";

//TODO(abhinav): Refactor this to make more composable.
export const apiRequestConfig = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: API_REQUEST_HEADERS,
  withCredentials: true,
};

const axiosInstance: AxiosInstance = axios.create();

export const axiosConnectionAbortedCode = "ECONNABORTED";
const executeActionRegex = /actions\/execute/;
const timeoutErrorRegex = /timeout of (\d+)ms exceeded/;

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
    // Return error when there is no internet
    if (!window.navigator.onLine) {
      return Promise.reject({
        ...error,
        message: createMessage(ERROR_0),
      });
    }

    // Return if the call was cancelled via cancel token
    if (axios.isCancel(error)) {
      return;
    }

    // Return modified response if action execution failed
    if (error.config && error.config.url.match(executeActionRegex)) {
      return makeExecuteActionResponse(error.response);
    }
    // Return error if any timeout happened in other api calls
    if (
      error.code === axiosConnectionAbortedCode &&
      error.message &&
      error.message.match(timeoutErrorRegex)
    ) {
      return Promise.reject({
        ...error,
        message: createMessage(SERVER_API_TIMEOUT_ERROR),
        code: ERROR_CODES.REQUEST_TIMEOUT,
      });
    }

    if (error.response) {
      if (error.response.status === API_STATUS_CODES.SERVER_ERROR) {
        return Promise.reject({
          ...error,
          code: ERROR_CODES.SERVER_ERROR,
          message: createMessage(ERROR_500),
        });
      }

      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (!is404orAuthPath()) {
        const currentUrl = `${window.location.href}`;
        if (error.response.status === API_STATUS_CODES.REQUEST_NOT_AUTHORISED) {
          // Redirect to login and set a redirect url.
          history.replace({
            pathname: AUTH_LOGIN_URL,
            search: `redirectUrl=${currentUrl}`,
          });
          return Promise.reject({
            code: ERROR_CODES.REQUEST_NOT_AUTHORISED,
            message: "Unauthorized. Redirecting to login page...",
            show: false,
          });
        }
        const errorData = error.response.data.responseMeta;
        if (
          errorData.status === API_STATUS_CODES.RESOURCE_NOT_FOUND &&
          errorData.error.code === SERVER_ERROR_CODES.RESOURCE_NOT_FOUND
        ) {
          return Promise.reject({
            code: ERROR_CODES.PAGE_NOT_FOUND,
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
      log.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      log.error("Error", error.message);
    }
    console.log(error.config);
    return Promise.resolve(error);
  },
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
