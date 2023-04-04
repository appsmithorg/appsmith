import { get } from "lodash";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import history from "utils/history";
import type { ApiResponse } from "api/ApiResponses";
import { Toaster, Variant } from "design-system-old";
import { flushErrors } from "actions/errorActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import type { User } from "constants/userConstants";
import {
  ERROR_CODES,
  SERVER_ERROR_CODES,
} from "@appsmith/constants/ApiConstants";
import { getSafeCrash } from "selectors/errorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { put, takeLatest, call, select } from "redux-saga/effects";
import {
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_0,
  DEFAULT_ERROR_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import store from "store";

import * as Sentry from "@sentry/react";
import { axiosConnectionAbortedCode } from "api/ApiUtils";
import { getLoginUrl } from "@appsmith/utils/adminSettingsHelpers";
import type { PluginErrorDetails } from "api/ActionAPI";

/**
 * making with error message with action name
 *
 * @param action
 */
export const getDefaultActionError = (action: string) =>
  `Incurred an error when ${action}`;

export function* callAPI(apiCall: any, requestPayload: any) {
  try {
    const response: ApiResponse = yield call(apiCall, requestPayload);
    return response;
  } catch (error) {
    return error;
  }
}

/**
 * transform server errors to client error codes
 *
 * @param code
 * @param resourceType
 */
const getErrorMessage = (code: number, resourceType = "") => {
  switch (code) {
    case 401:
      return createMessage(ERROR_401);
    case 500:
      return createMessage(ERROR_500);
    case 403:
      return createMessage(() =>
        ERROR_403(resourceType, getCurrentUser(store.getState())?.email || ""),
      );
    case 0:
      return createMessage(ERROR_0);
  }
};

export class IncorrectBindingError extends Error {}

/**
 * validates if response does have any errors
 * @throws {Error}
 * @param response
 * @param show
 * @param logToSentry
 */
export function* validateResponse(
  response: ApiResponse | any,
  show = true,
  logToSentry = false,
) {
  if (!response) {
    throw Error("");
  }

  // letting `apiFailureResponseInterceptor` handle it this case
  if (response?.code === axiosConnectionAbortedCode) {
    return false;
  }

  if (!response.responseMeta && !response.status) {
    throw Error(getErrorMessage(0));
  }
  if (!response.responseMeta && response.status) {
    throw Error(getErrorMessage(response.status, response.resourceType));
  }
  if (response.responseMeta.success) {
    return true;
  }
  if (
    SERVER_ERROR_CODES.INCORRECT_BINDING_LIST_OF_WIDGET.includes(
      response.responseMeta.error.code,
    )
  ) {
    throw new IncorrectBindingError(response.responseMeta.error.message);
  }

  yield put({
    type: ReduxActionErrorTypes.API_ERROR,
    payload: {
      error: response.responseMeta.error,
      logToSentry,
      show,
    },
  });
  throw Error(response.responseMeta.error.message);
}

export function getResponseErrorMessage(response: ApiResponse) {
  return response.responseMeta.error
    ? response.responseMeta.error.message
    : undefined;
}

type ClientDefinedErrorMetadata = {
  clientDefinedError: boolean;
  statusCode: string;
  message: string;
  pluginErrorDetails: PluginErrorDetails;
};

export function extractClientDefinedErrorMetadata(
  err: any,
): ClientDefinedErrorMetadata | undefined {
  if (err?.clientDefinedError && err?.response) {
    return {
      clientDefinedError: err?.clientDefinedError,
      statusCode: err?.statusCode,
      message: err?.message,
      pluginErrorDetails: err?.pluginErrorDetails,
    };
  } else {
    return undefined;
  }
}

type ErrorPayloadType = {
  code?: number | string;
  message?: string;
  crash?: boolean;
};
const ActionErrorDisplayMap: {
  [key: string]: (error: ErrorPayloadType) => string;
} = {
  [ReduxActionErrorTypes.API_ERROR]: (error) =>
    get(error, "message", createMessage(DEFAULT_ERROR_MESSAGE)),
  [ReduxActionErrorTypes.FETCH_PAGE_ERROR]: () =>
    getDefaultActionError("fetching the page"),
  [ReduxActionErrorTypes.SAVE_PAGE_ERROR]: () =>
    getDefaultActionError("saving the page"),
};

const getErrorMessageFromActionType = (
  type: string,
  error: ErrorPayloadType,
): string => {
  const actionErrorMessage = get(error, "message");
  if (actionErrorMessage === undefined) {
    if (type in ActionErrorDisplayMap) {
      return ActionErrorDisplayMap[type](error);
    }
    return createMessage(DEFAULT_ERROR_MESSAGE);
  }
  return actionErrorMessage;
};

enum ErrorEffectTypes {
  SHOW_ALERT = "SHOW_ALERT",
  SAFE_CRASH = "SAFE_CRASH",
  LOG_ERROR = "LOG_ERROR",
  LOG_TO_SENTRY = "LOG_TO_SENTRY",
}

export interface ErrorActionPayload {
  error: ErrorPayloadType;
  show?: boolean;
  crash?: boolean;
  logToSentry?: boolean;
}

export function* errorSaga(errorAction: ReduxAction<ErrorActionPayload>) {
  const effects = [ErrorEffectTypes.LOG_ERROR];
  const { payload, type } = errorAction;
  const { error, logToSentry, show = true } = payload || {};
  const message = getErrorMessageFromActionType(type, error);

  if (show) {
    effects.push(ErrorEffectTypes.SHOW_ALERT);
  }

  if (error && error.crash) {
    effects.push(ErrorEffectTypes.LOG_TO_SENTRY);
    effects.push(ErrorEffectTypes.SAFE_CRASH);
  }

  if (error && logToSentry) {
    effects.push(ErrorEffectTypes.LOG_TO_SENTRY);
  }

  for (const effect of effects) {
    switch (effect) {
      case ErrorEffectTypes.LOG_ERROR: {
        logErrorSaga(errorAction);
        break;
      }
      case ErrorEffectTypes.SHOW_ALERT: {
        showAlertAboutError(message);
        break;
      }
      case ErrorEffectTypes.SAFE_CRASH: {
        yield call(crashAppSaga, error);
        break;
      }
      case ErrorEffectTypes.LOG_TO_SENTRY: {
        yield call(Sentry.captureException, error);
        break;
      }
    }
  }

  yield put({
    type: ReduxActionTypes.REPORT_ERROR,
    payload: {
      source: errorAction.type,
      message,
    },
  });
}

function logErrorSaga(action: ReduxAction<{ error: ErrorPayloadType }>) {
  log.debug(`Error in action ${action.type}`);
  if (action.payload) log.error(action.payload.error);
}

function showAlertAboutError(message: string) {
  Toaster.show({ text: message, variant: Variant.danger });
}

function* crashAppSaga(error: ErrorPayloadType) {
  yield put({
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
    payload: error,
  });
}

/**
 * this saga do some logic before actually setting safeCrash to true
 */
function* safeCrashSagaRequest(action: ReduxAction<{ code?: string }>) {
  const user: User | undefined = yield select(getCurrentUser);
  const code = get(action, "payload.code");

  // if user is not logged and the error is "PAGE_NOT_FOUND",
  // redirecting user to login page with redirecTo param
  if (
    get(user, "email") === ANONYMOUS_USERNAME &&
    code === ERROR_CODES.PAGE_NOT_FOUND
  ) {
    const queryParams = new URLSearchParams(window.location.search);
    const embedQueryParam = queryParams.get("embed");
    const ssoTriggerQueryParam = queryParams.get("ssoTrigger");
    const ssoLoginUrl =
      embedQueryParam === "true" && ssoTriggerQueryParam
        ? getLoginUrl(ssoTriggerQueryParam || "")
        : null;
    if (ssoLoginUrl) {
      window.location.href = `${ssoLoginUrl}?redirectUrl=${encodeURIComponent(
        window.location.href,
      )}`;
    } else {
      window.location.href = `${AUTH_LOGIN_URL}?redirectUrl=${encodeURIComponent(
        window.location.href,
      )}`;
    }

    return false;
  }

  // if there is no action to be done, just calling the safe crash action
  yield put({
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
    payload: {
      code,
    },
  });
}

/**
 * flush errors and redirect users to a url
 *
 * @param action
 */
export function* flushErrorsAndRedirectSaga(
  action: ReduxAction<{ url?: string }>,
) {
  const safeCrash: boolean = yield select(getSafeCrash);

  if (safeCrash) {
    yield put(flushErrors());
  }
  if (!action.payload.url) return;

  history.push(action.payload.url);
}

export default function* errorSagas() {
  yield takeLatest(Object.values(ReduxActionErrorTypes), errorSaga);
  yield takeLatest(
    ReduxActionTypes.FLUSH_AND_REDIRECT,
    flushErrorsAndRedirectSaga,
  );
  yield takeLatest(
    ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
    safeCrashSagaRequest,
  );
}
