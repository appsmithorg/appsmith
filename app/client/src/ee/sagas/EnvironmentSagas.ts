import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ApiResponse } from "api/ApiResponses";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import EnvironmentApi from "@appsmith/api/EnvironmentApi";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import type FeatureFlags from "entities/FeatureFlags";
import { selectFeatureFlags } from "selectors/usersSelectors";

// Saga to handle fetching the environment configs
function* FetchEnvironmentsInitSaga(
  action: ReduxAction<{ workspaceId?: string } | undefined>,
) {
  const workspaceId: string = action.payload?.workspaceId
    ? action.payload?.workspaceId
    : yield select(getCurrentWorkspaceId);
  try {
    const response: ApiResponse = yield call(
      EnvironmentApi.fetchEnvironmentConfigs,
      workspaceId,
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

// function to fetch workspace id and start fetching the envs
function* fetchWorkspaceIdandInitSaga() {
  const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
  // Only fetch if the feature flag allows it
  if (featureFlags.DATASOURCE_ENVIRONMENTS) {
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    yield put(fetchingEnvironmentConfigs({ workspaceId }));
  }
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
  ]);
}
