import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ApiResponse } from "api/ApiResponses";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import EnvironmentApi from "@appsmith/api/EnvironmentApi";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";
import {
  ENVIRONMENT_QUERY_KEY,
  updateLocalStorage,
} from "@appsmith/utils/Environments";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";

// Saga to handle fetching the environment configs
function* FetchEnvironmentsInitSaga(action: ReduxAction<string>) {
  try {
    const response: ApiResponse<EnvironmentType[]> = yield call(
      EnvironmentApi.fetchEnvironmentConfigs,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const defaultEnvironment = response.data.find(
        (env: EnvironmentType) => env.isDefault,
      );
      const datasourceEnv: boolean = yield select(datasourceEnvEnabled);
      // Only fetch if the feature flag allows it
      if (defaultEnvironment) {
        updateLocalStorage(defaultEnvironment.name, defaultEnvironment.id);
        if (datasourceEnv) {
          const queryParams = new URLSearchParams(window.location.search);
          // Set new or modify existing parameter value.
          queryParams.set(
            ENVIRONMENT_QUERY_KEY,
            defaultEnvironment.name.toLowerCase(),
          );
          // Replace current querystring with the new one.
          window.history.replaceState({}, "", "?" + queryParams.toString());
        }
      }
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
function* fetchWorkspaceIdandInitSaga(
  actionPayload: ReduxAction<{ workspaceId: string } | string>,
) {
  const action = actionPayload.type;
  let workspaceId = "";

  // in case the action triggering this saga is SET_WORKSPACE_ID_FOR_IMPORT, payload is workspaceId
  if (action === ReduxActionTypes.SET_WORKSPACE_ID_FOR_IMPORT) {
    workspaceId = actionPayload.payload as string;
  } else {
    // in case the action triggering this saga is SET_CURRENT_WORKSPACE_ID, payload is {workspaceId: string}
    workspaceId = (actionPayload.payload as Record<string, string>)
      ?.workspaceId;
  }

  if (!workspaceId) return;
  yield put(fetchingEnvironmentConfigs(workspaceId));
}

export default function* EnvironmentSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
      fetchWorkspaceIdandInitSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_WORKSPACE_ID_FOR_IMPORT,
      fetchWorkspaceIdandInitSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
      FetchEnvironmentsInitSaga,
    ),
  ]);
}
