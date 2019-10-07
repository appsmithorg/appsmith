import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  ActionErrorDisplayMap,
} from "../constants/ReduxActionConstants";

import AppToaster from "../editorComponents/ToastComponent";
import { Intent } from "@blueprintjs/core";

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

export function* errorSaga(
  errorAction: ReduxAction<{ error: { message: string } }>,
) {
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
