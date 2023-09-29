import { takeLatest, all, call, put } from "redux-saga/effects";

import PackageApi from "@appsmith/api/PackageApi";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import {
  createMessage,
  FETCH_PACKAGE_ERROR,
} from "@appsmith/constants/messages";
import type { ApiResponse } from "api/ApiResponses";

export function* fetchAllPackagesSaga() {
  try {
    const response: ApiResponse = yield call(PackageApi.fetchAllPackages);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGE_ERROR) } },
    });
  }
}

export default function* packagesSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_ALL_PACKAGES_INIT, fetchAllPackagesSaga),
  ]);
}
