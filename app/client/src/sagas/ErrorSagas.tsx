import { get } from "lodash";
import {
  type ReduxAction,
  toastMessageErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import log from "loglevel";
import history from "utils/history";
import type { ApiResponse } from "api/ApiResponses";
import { flushErrors, safeCrashApp } from "actions/errorActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import type { User } from "constants/userConstants";
import { ERROR_CODES, SERVER_ERROR_CODES } from "ee/constants/ApiConstants";
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
} from "ee/constants/messages";
import store from "store";
import { AXIOS_CONNECTION_ABORTED_CODE } from "ee/constants/ApiConstants";
import { getLoginUrl } from "ee/utils/adminSettingsHelpers";
import type { PluginErrorDetails } from "api/ActionAPI";
import showToast from "sagas/ToastSagas";
import AppsmithConsole from "../utils/AppsmithConsole";
import type { SourceEntity } from "../entities/AppsmithConsole";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "../entities/App";
import { captureException } from "instrumentation";

const shouldShowToast = (action: string) => {
  return action in toastMessageErrorTypes;
};

/**
 * making with error message with action name
 *
 * @param action
 */
export const getDefaultActionError = (action: string) =>
  `Incurred an error when ${action}`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * @param logToMonitoring
 */
export function* validateResponse(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: ApiResponse | any,
  show = true,
  logToMonitoring = false,
) {
  if (!response) {
    throw Error("");
  }

  // letting `apiFailureResponseInterceptor` handle it this case
  if (response?.code === AXIOS_CONNECTION_ABORTED_CODE) {
    return false;
  }

  if (!response.responseMeta && !response.status) {
    throw Error(getErrorMessage(0));
  }

  if (!response.responseMeta && response.status) {
    yield put({
      type: ReduxActionErrorTypes.API_ERROR,
      payload: {
        error: new Error(
          getErrorMessage(response.status, response.resourceType),
        ),
        logToMonitoring,
        show,
      },
    });
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
      error: new Error(response.responseMeta.error.message),
      logToMonitoring,
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

interface ClientDefinedErrorMetadata {
  clientDefinedError: boolean;
  statusCode: string;
  message: string;
  pluginErrorDetails: PluginErrorDetails;
}

export function extractClientDefinedErrorMetadata(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface ErrorPayloadType {
  code?: number | string;
  message?: string;
  crash?: boolean;
}
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
  LOG_TO_CONSOLE = "LOG_TO_CONSOLE",
  LOG_TO_MONITORING = "LOG_TO_MONITORING",
  LOG_TO_DEBUGGER = "LOG_TO_DEBUGGER",
}

export interface ErrorActionPayload {
  error: ErrorPayloadType;
  show?: boolean;
  crash?: boolean;
  logToMonitoring?: boolean;
  logToDebugger?: boolean;
  sourceEntity?: SourceEntity;
}

export function* errorSaga(errorAction: ReduxAction<ErrorActionPayload>) {
  const effects = [ErrorEffectTypes.LOG_TO_CONSOLE];
  const { payload, type } = errorAction;
  const { error, logToDebugger, logToMonitoring, show, sourceEntity } =
    payload || {};
  const appMode: APP_MODE = yield select(getAppMode);

  // "show" means show a toast. We check if the error has been asked to not been shown
  // By checking undefined, undecided actions still pass through this check
  if (show === undefined) {
    // We want to show toasts for certain actions only so we avoid issues or if it is outside edit mode
    if (shouldShowToast(type) || appMode !== APP_MODE.EDIT) {
      effects.push(ErrorEffectTypes.SHOW_ALERT);
    }
    // If true is passed, show the error no matter what
  } else if (show) {
    effects.push(ErrorEffectTypes.SHOW_ALERT);
  }

  if (logToDebugger) {
    effects.push(ErrorEffectTypes.LOG_TO_DEBUGGER);
  }

  if (error && error.crash) {
    effects.push(ErrorEffectTypes.LOG_TO_MONITORING);
    effects.push(ErrorEffectTypes.SAFE_CRASH);
  }

  if (error && logToMonitoring) {
    effects.push(ErrorEffectTypes.LOG_TO_MONITORING);
  }

  const message = getErrorMessageFromActionType(type, error);

  for (const effect of effects) {
    switch (effect) {
      case ErrorEffectTypes.LOG_TO_CONSOLE: {
        logErrorSaga(errorAction);
        break;
      }
      case ErrorEffectTypes.LOG_TO_DEBUGGER: {
        AppsmithConsole.error({
          text: message,
          source: sourceEntity,
        });
        break;
      }
      case ErrorEffectTypes.SHOW_ALERT: {
        // This is the toast that is rendered when any page load API fails.
        yield call(showToast, message, { kind: "error" });

        if ("Cypress" in window) {
          if (message === "" || message === null) {
            yield put(
              safeCrashApp({
                ...error,
                code: ERROR_CODES.CYPRESS_DEBUG,
              }),
            );
          }
        }

        break;
      }
      case ErrorEffectTypes.SAFE_CRASH: {
        yield put(safeCrashApp(error));
        break;
      }
      case ErrorEffectTypes.LOG_TO_MONITORING: {
        yield call(captureException, error);
        break;
      }
    }
  }

  yield put({
    type: ReduxActionTypes.REPORT_ERROR,
    payload: {
      source: errorAction.type,
      message,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stackTrace: (error as any)?.stack,
    },
  });
}

function logErrorSaga(action: ReduxAction<{ error: ErrorPayloadType }>) {
  log.debug(`Error in action ${action.type}`);

  if (action.payload) log.error(action.payload.error, action);
}

export function embedRedirectURL() {
  const queryParams = new URLSearchParams(window.location.search);
  const ssoTriggerQueryParam = queryParams.get("ssoTrigger");
  const ssoLoginUrl = ssoTriggerQueryParam
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
}

/**
 * this saga do some logic before actually setting safeCrash to true
 */
function* safeCrashSagaRequest(action: ReduxAction<{ code?: ERROR_CODES }>) {
  const user: User | undefined = yield select(getCurrentUser);
  const code = get(action, "payload.code");

  // if user is not logged and the error is "PAGE_NOT_FOUND",
  // redirecting user to login page with redirecTo param
  if (
    get(user, "email") === ANONYMOUS_USERNAME &&
    code === ERROR_CODES.PAGE_NOT_FOUND
  ) {
    embedRedirectURL();

    return false;
  }

  // if there is no action to be done, just calling the safe crash action
  yield put(safeCrashApp({ code }));
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
