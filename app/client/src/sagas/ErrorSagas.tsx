import { get } from "lodash";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import log from "loglevel";
import history from "utils/history";
import { ApiResponse } from "api/ApiResponses";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { flushErrors } from "actions/errorActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import { ERROR_CODES, SERVER_ERROR_CODES } from "constants/ApiConstants";
import { getSafeCrash } from "selectors/errorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { put, takeLatest, call, select } from "redux-saga/effects";
import {
  ERROR_401,
  ERROR_500,
  ERROR_0,
  DEFAULT_ERROR_MESSAGE,
  createMessage,
} from "constants/messages";

/**
 * making with error message with action name
 *
 * @param action
 */
export const getDefaultActionError = (action: string) =>
  `Incurred an error when ${action}`;

export function* callAPI(apiCall: any, requestPayload: any) {
  try {
    return yield call(apiCall, requestPayload);
  } catch (error) {
    return yield error;
  }
}

/**
 * transforn server errors to client error codes
 *
 * @param code
 */
const getErrorMessage = (code: number) => {
  switch (code) {
    case 401:
      return createMessage(ERROR_401);
    case 500:
      return createMessage(ERROR_500);
    case 0:
      return createMessage(ERROR_0);
  }
};

export class IncorrectBindingError extends Error {}

/**
 * validates if response does have any errors
 *
 * @param response
 * @param show
 */
export function* validateResponse(response: ApiResponse | any, show = true) {
  if (!response) {
    throw Error("");
  }
  if (!response.responseMeta && !response.status) {
    throw Error(getErrorMessage(0));
  }
  if (!response.responseMeta && response.status) {
    throw Error(getErrorMessage(response.status));
  }
  if (response.responseMeta.success) {
    return true;
  } else {
    if (
      response.responseMeta.error.code ===
      SERVER_ERROR_CODES.INCORRECT_BINDING_LIST_OF_WIDGET
    ) {
      throw new IncorrectBindingError(response.responseMeta.error.message);
    } else {
      yield put({
        type: ReduxActionErrorTypes.API_ERROR,
        payload: {
          error: response.responseMeta.error,
          show,
        },
      });
      throw Error(response.responseMeta.error.message);
    }
  }
}

export function getResponseErrorMessage(response: ApiResponse) {
  return response.responseMeta.error
    ? response.responseMeta.error.message
    : undefined;
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
}

export interface ErrorActionPayload {
  error: ErrorPayloadType;
  show?: boolean;
  crash?: boolean;
}

export function* errorSaga(errorAction: ReduxAction<ErrorActionPayload>) {
  const effects = [ErrorEffectTypes.LOG_ERROR];
  const { type, payload } = errorAction;
  const { show = true, error } = payload || {};
  const message = getErrorMessageFromActionType(type, error);

  if (show) {
    effects.push(ErrorEffectTypes.SHOW_ALERT);
  }

  if (error && error.crash) {
    effects.push(ErrorEffectTypes.SAFE_CRASH);
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
  const user = yield select(getCurrentUser);
  const code = get(action, "payload.code");

  // if user is not logged and the error is "PAGE_NOT_FOUND",
  // redirecting user to login page with redirecTo param
  if (
    get(user, "email") === ANONYMOUS_USERNAME &&
    code === ERROR_CODES.PAGE_NOT_FOUND
  ) {
    window.location.href = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}`;

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
  const safeCrash = yield select(getSafeCrash);

  if (safeCrash) {
    yield put(flushErrors());
  }

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
