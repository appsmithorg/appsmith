import _ from "lodash";
import axios from "axios";
import {
  BASE_URL,
  REQUEST_TIMEOUT_MS,
  REQUEST_HEADERS,
  AUTH_CREDENTIALS,
} from "../constants/ApiConstants";
import { ActionApiResponse, ActionResponse } from "./ActionAPI";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: REQUEST_HEADERS,
  withCredentials: true,
  auth: AUTH_CREDENTIALS,
});

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
    if (error.config.url.match(executeActionRegex)) {
      return makeExecuteActionResponse(error.response);
    }
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
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
    return Promise.reject(error);
  },
);

class Api {
  static get(url: string, queryParams?: any) {
    return axiosInstance.get(
      url + this.convertObjectToQueryParams(queryParams),
    );
  }

  static post(url: string, body?: any, queryParams?: any) {
    return axiosInstance.post(
      url + this.convertObjectToQueryParams(queryParams),
      body,
    );
  }

  static put(url: string, queryParams?: any, body?: any) {
    return axiosInstance.put(
      url + this.convertObjectToQueryParams(queryParams),
      body,
    );
  }

  static delete(url: string, queryParams?: any) {
    return axiosInstance.delete(
      url + this.convertObjectToQueryParams(queryParams),
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
