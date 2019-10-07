import _ from "lodash";
import { Intent } from "@blueprintjs/core";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import AppToaster from "../editorComponents/ToastComponent";
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ACTION_ERROR,
} from "../constants/errors";
import { ApiResponse } from "../api/ApiResponses";
import { put, takeLatest } from "redux-saga/effects";

export function* validateResponse(response: ApiResponse) {
  if (response.responseMeta.success) {
    return true;
  } else {
    yield put({
      type: ReduxActionErrorTypes.API_ERROR,
      payload: {
        error: response.responseMeta.error,
      },
    });
    return false;
  }
}

type IError = object | { message: string };

const ActionErrorDisplayMap: {
  [key: string]: (error: IError) => string;
} = {
  [ReduxActionErrorTypes.API_ERROR]: error =>
    _.get(error, "message", DEFAULT_ERROR_MESSAGE),
  [ReduxActionErrorTypes.FETCH_PAGE_ERROR]: () =>
    DEFAULT_ACTION_ERROR("fetching the page"),
  [ReduxActionErrorTypes.SAVE_PAGE_ERROR]: () =>
    DEFAULT_ACTION_ERROR("saving the page"),
  [ReduxActionErrorTypes.FETCH_WIDGET_CARDS_ERROR]: () => DEFAULT_ERROR_MESSAGE,
  [ReduxActionErrorTypes.WIDGET_OPERATION_ERROR]: () => DEFAULT_ERROR_MESSAGE,
};

export function* errorSaga(errorAction: ReduxAction<{ error: IError }>) {
  // Just a pass through for now.
  // Add procedures to customize errors here
  console.log({ error: errorAction });
  // Show a toast when the error occurs
  const {
    type,
    payload: { error },
  } = errorAction;
  const message = ActionErrorDisplayMap[type](error);
  AppToaster.show({ message, intent: Intent.DANGER });
  yield put({
    type: ReduxActionTypes.REPORT_ERROR,
    payload: {
      message: errorAction.payload.error,
      source: errorAction.type,
    },
  });
}

export default function* errorSagas() {
  yield takeLatest(Object.values(ReduxActionErrorTypes), errorSaga);
}
