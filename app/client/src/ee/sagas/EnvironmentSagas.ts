import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { ApiResponse } from "api/ApiResponses";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import EnvironmentApi from "@appsmith/api/EnvironmentApi";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";

function* FetchEnvironmentsInitSaga(action: ReduxAction<string>) {
  try {
    const response: ApiResponse = yield call(
      EnvironmentApi.fetchEnvironmentConfigs,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS,
        payload: (response?.data as any) || [],
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ENVIRONMENT_FAILED,
        payload: response?.responseMeta,
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.FETCH_ENVIRONMENT_FAILED,
      payload: {
        error: "failed",
      },
    });
  }
}

function* fetchWorkspaceIdandInitSaga() {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  yield put(fetchingEnvironmentConfigs(workspaceId));
}

export default function* EnvironmentSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      fetchWorkspaceIdandInitSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
      FetchEnvironmentsInitSaga,
    ),
    // debounce(
    //   1,
    //   ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
    //   FetchEnvironmentsInitSaga,
    // ),
  ]);
}
