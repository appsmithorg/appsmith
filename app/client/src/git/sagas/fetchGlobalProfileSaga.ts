import { call, put } from "redux-saga/effects";
import fetchGlobalProfileRequest from "../requests/fetchGlobalProfileRequest";
import type { FetchGlobalProfileResponse } from "../requests/fetchGlobalProfileRequest.types";
import { gitConfigActions } from "../store/gitConfigSlice";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

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
  } catch (error) {
    yield put(
      gitConfigActions.fetchGlobalProfileError({
        error: error as string,
      }),
    );
  }
}
