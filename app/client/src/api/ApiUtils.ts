import {
  createMessage,
  ERROR_0,
  ERROR_413,
  ERROR_500,
  GENERIC_API_EXECUTION_ERROR,
  SERVER_API_TIMEOUT_ERROR,
} from "@appsmith/constants/messages";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import {
  API_STATUS_CODES,
  ERROR_CODES,
  SERVER_ERROR_CODES,
} from "@appsmith/constants/ApiConstants";
import log from "loglevel";
import type { ActionExecutionResponse } from "api/ActionAPI";
import store from "store";
import { logoutUser } from "actions/userActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import getQueryParamsObject from "utils/getQueryParamsObject";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "@appsmith/configs";
import * as Sentry from "@sentry/react";
import { CONTENT_TYPE_HEADER_KEY } from "constants/ApiEditorConstants/CommonApiConstants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

const executeActionRegex = /actions\/execute/;
const timeoutErrorRegex = /timeout of (\d+)ms exceeded/;
export const axiosConnectionAbortedCode = "ECONNABORTED";
const appsmithConfig = getAppsmithConfigs();

export const BLOCKED_ROUTES = [
  "v1/app-templates",
  "v1/marketplace",
  "v1/datasources/mocks",
  "v1/usage-pulse",
  "v1/applications/releaseItems",
  "v1/saas",
];

export const BLOCKED_ROUTES_REGEX = new RegExp(
  `^(${BLOCKED_ROUTES.join("|")})($|/)`,
);

const makeExecuteActionResponse = (response: any): ActionExecutionResponse => ({
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

export const blockedApiRoutesForAirgapInterceptor = (
  config: AxiosRequestConfig,
) => {
  const { url } = config;

  const isAirgappedInstance = isAirgapped();
  if (isAirgappedInstance && url && BLOCKED_ROUTES_REGEX.test(url)) {
    return Promise.resolve({ data: null, status: 200 });
  }
  return config;
};

// Request interceptor will add a timer property to the request.
// this will be used to calculate the time taken for an action
// execution request
export const apiRequestInterceptor = (config: AxiosRequestConfig) => {
  config.headers = config.headers ?? {};

  // Add header for CSRF protection.
  const methodUpper = config.method?.toUpperCase();
  if (methodUpper && methodUpper !== "GET" && methodUpper !== "HEAD") {
    config.headers["X-Requested-By"] = "Appsmith";
  }

  const branch =
    getCurrentGitBranch(store.getState()) || getQueryParamsObject().branch;
  if (branch && config.headers) {
    config.headers.branchName = branch;
  }
  if (config.url?.indexOf("/git/") !== -1) {
    config.timeout = 1000 * 120; // increase timeout for git specific APIs
  }

  const anonymousId = AnalyticsUtil.getAnonymousId();
  appsmithConfig.segment.enabled &&
    anonymousId &&
    (config.headers["x-anonymous-user-id"] = anonymousId);

  return { ...config, timer: performance.now() };
};

// On success of an API, if the api is an action execution,
// add the client meta object with size and time taken info
// otherwise just return the data
export const apiSuccessResponseInterceptor = (
  response: AxiosResponse,
): AxiosResponse["data"] => {
  if (response.config.url) {
    if (response.config.url.match(executeActionRegex)) {
      return makeExecuteActionResponse(response);
    }
  }
  if (
    response.headers[CONTENT_TYPE_HEADER_KEY] === "application/json" &&
    !response.data.responseMeta
  ) {
    Sentry.captureException(new Error("Api responded without response meta"), {
      contexts: { response: response.data },
    });
  }
  return response.data;
};

// Handle different api failure scenarios
export const apiFailureResponseInterceptor = (error: any) => {
  // this can be extended to other errors we want to catch.
  // in this case it is 413.
  if (error && error?.response && error?.response.status === 413) {
    return Promise.reject({
      ...error,
      clientDefinedError: true,
      statusCode: "AE-APP-4013",
      message: createMessage(ERROR_413, 100),
      pluginErrorDetails: {
        appsmithErrorCode: "AE-APP-4013",
        appsmithErrorMessage: createMessage(ERROR_413, 100),
        errorType: "INTERNAL_ERROR", // this value is from the server, hence cannot construct enum type.
        title: createMessage(GENERIC_API_EXECUTION_ERROR),
      },
    });
  }

  // Return error when there is no internet
  if (!window.navigator.onLine) {
    return Promise.reject({
      ...error,
      message: createMessage(ERROR_0),
    });
  }

  // Return if the call was cancelled via cancel token
  if (axios.isCancel(error)) {
    throw new UserCancelledActionExecutionError();
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
        store.dispatch(
          logoutUser({
            redirectURL: `${AUTH_LOGIN_URL}?redirectUrl=${encodeURIComponent(
              currentUrl,
            )}`,
          }),
        );
        return Promise.reject({
          code: ERROR_CODES.REQUEST_NOT_AUTHORISED,
          message: "Unauthorized. Redirecting to login page...",
          show: false,
        });
      }
      const errorData = error.response.data.responseMeta ?? {};
      if (
        errorData.status === API_STATUS_CODES.RESOURCE_NOT_FOUND &&
        (SERVER_ERROR_CODES.RESOURCE_NOT_FOUND.includes(errorData.error.code) ||
          SERVER_ERROR_CODES.UNABLE_TO_FIND_PAGE.includes(errorData.error.code))
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
    Sentry.captureException(new Error("Api responded without response meta"), {
      contexts: { response: error.response.data },
    });
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
  log.debug(error.config);
  return Promise.resolve(error);
};
