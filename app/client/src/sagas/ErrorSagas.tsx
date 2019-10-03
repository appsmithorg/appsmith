import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";

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

export function* errorSaga(errorAction: ReduxAction<{ error: any }>) {
  // Just a pass through for now.
  // Add procedures to customize errors here
  console.log(errorAction.payload.error);
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
