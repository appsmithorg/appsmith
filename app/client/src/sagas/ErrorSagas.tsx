import _ from "lodash";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { DEFAULT_ERROR_MESSAGE, DEFAULT_ACTION_ERROR } from "constants/errors";
import { ApiResponse } from "api/ApiResponses";
import { put, takeLatest, call, select } from "redux-saga/effects";
import { ERROR_401, ERROR_500, ERROR_0 } from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import log from "loglevel";
import { flushErrors } from "actions/errorActions";
import history from "utils/history";
import { getSafeCrash } from "selectors/errorSelectors";

export function* callAPI(apiCall: any, requestPayload: any) {
  try {
    return yield call(apiCall, requestPayload);
  } catch (error) {
    return yield error;
  }
}
const getErrorMessage = (code: number) => {
  switch (code) {
    case 401:
      return ERROR_401;
    case 500:
      return ERROR_500;
    case 0:
      return ERROR_0;
  }
};

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
let ActionErrorDisplayMap: {
  [key: string]: (error: ErrorPayloadType) => string;
} = {};

Object.keys(ReduxActionErrorTypes).forEach((type: string) => {
  ActionErrorDisplayMap[type] = () =>
    DEFAULT_ERROR_MESSAGE + " action: " + type;
});

ActionErrorDisplayMap = {
  ...ActionErrorDisplayMap,
  [ReduxActionErrorTypes.API_ERROR]: error =>
    _.get(error, "message", DEFAULT_ERROR_MESSAGE),
  [ReduxActionErrorTypes.FETCH_PAGE_ERROR]: () =>
    DEFAULT_ACTION_ERROR("fetching the page"),
  [ReduxActionErrorTypes.SAVE_PAGE_ERROR]: () =>
    DEFAULT_ACTION_ERROR("saving the page"),
};

enum ErrorEffectTypes {
  SHOW_ALERT = "SHOW_ALERT",
  SAFE_CRASH = "SAFE_CRASH",
  LOG_ERROR = "LOG_ERROR",
}

export function* errorSaga(
  errorAction: ReduxAction<{
    error: ErrorPayloadType;
    show?: boolean;
    crash?: boolean;
  }>,
) {
  const effects = [ErrorEffectTypes.LOG_ERROR];
  const {
    type,
    payload: { show = true, error },
  } = errorAction;
  const message =
    error && error.message ? error.message : ActionErrorDisplayMap[type](error);

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
        yield call(crashAppSaga);
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

function* crashAppSaga() {
  yield put({
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
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
}
