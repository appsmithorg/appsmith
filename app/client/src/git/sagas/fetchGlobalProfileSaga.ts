import { call, put } from "redux-saga/effects";
import fetchGlobalProfileRequest from "../requests/fetchGlobalProfileRequest";
import type { FetchGlobalProfileResponse } from "../requests/fetchGlobalProfileRequest.types";
import { gitConfigActions } from "../store/gitConfigSlice";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* fetchGlobalProfileSaga() {
  let response: FetchGlobalProfileResponse | undefined;

  try {
    response = yield call(fetchGlobalProfileRequest);

    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitConfigActions.fetchGlobalProfileSuccess({
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitConfigActions.fetchGlobalProfileError({
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
