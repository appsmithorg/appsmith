import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ApiResponse } from "api/ApiResponses";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import EnvironmentApi from "@appsmith/api/EnvironmentApi";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";
import {
  ENVIRONMENT_ID_LOCAL_STORAGE_KEY,
  ENVIRONMENT_QUERY_KEY,
  removeCurrentEnvironment,
  setCurrentEditingEnvID,
  updateLocalStorage,
} from "@appsmith/utils/Environments";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

const checkIfEnvIsAlreadySet = (
  envs: EnvironmentType[],
  queryParams: URLSearchParams,
) => {
  // check if query params have the environment name
  // do not override the default environment if it is already set

  if (queryParams.has(ENVIRONMENT_QUERY_KEY)) {
    // check if this env is present in the incoming payload
    const envName = queryParams.get(ENVIRONMENT_QUERY_KEY);
    const env = envs.find(
      (env: EnvironmentType) =>
        env.name.toLowerCase() === envName &&
        env.userPermissions &&
        env.userPermissions.length > 0 &&
        env.userPermissions[0] === PERMISSION_TYPE.EXECUTE_ENVIRONMENT,
    );
    // if the env is not present in the incoming payload, override the localstorage
    if (!env) {
      return false;
    }
  }

  // check localstorage if the default environment is already set
  const localStorageEnvId = localStorage.getItem(
    ENVIRONMENT_ID_LOCAL_STORAGE_KEY,
  );
  if (!localStorageEnvId || localStorageEnvId.length === 0) return false;

  // check if this id is present in the incoming payload
  const localStorageEnv = envs.find(
    (env: EnvironmentType) => env.id === localStorageEnvId,
  );

  if (!!localStorageEnv) {
    return true;
  }

  return false;
};

// Saga to handle fetching the environment configs
function* FetchEnvironmentsInitSaga(action: ReduxAction<string>) {
  try {
    const response: ApiResponse<EnvironmentType[]> = yield call(
      EnvironmentApi.fetchEnvironmentConfigs,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const queryParams = new URLSearchParams(window.location.search);
      // list of env  which is exec
      const executableEnvs = response.data.filter(
        (env) =>
          env.userPermissions &&
          env.userPermissions.length > 0 &&
          env.userPermissions[0] === PERMISSION_TYPE.EXECUTE_ENVIRONMENT,
      );
      // if there are no executable environments then remove the current environment from localstorage and query param.
      if (executableEnvs.length === 0) {
        removeCurrentEnvironment();
        queryParams.delete(ENVIRONMENT_QUERY_KEY);
        window.history.replaceState({}, "", "?" + queryParams.toString());
      } else {
        const defaultEnvironment = executableEnvs.find(
          (env: EnvironmentType) => env.isDefault,
        );
        const datasourceEnv: boolean = yield select(datasourceEnvEnabled);
        const seletedEnv = defaultEnvironment
          ? defaultEnvironment
          : executableEnvs[0];
        // Check if there was any environment set in previous session and if it is valid for currently.
        // If not, update the environemnt to selected environment.
        if (!checkIfEnvIsAlreadySet(executableEnvs, queryParams)) {
          updateLocalStorage(seletedEnv.name, seletedEnv.id);
          if (datasourceEnv) {
            // Set new if there is no query param
            queryParams.set(
              ENVIRONMENT_QUERY_KEY,
              seletedEnv.name.toLowerCase(),
            );
            // Replace current querystring with the new one. Make sure the # stays intact
            // We also need to make sure hash doesn't have any query params
            // TODO: Convert this to a util function in utils/URLUtils.ts
            const hash = window.location.hash;
            window.history.replaceState(
              {},
              "",
              `${hash}${
                hash.includes("?") ? "&" : "?"
              }${queryParams.toString()}`,
            );
          }
        }
        setCurrentEditingEnvID(seletedEnv.id);
      }
      let envsData: Array<EnvironmentType> = [];
      if (!!response.data && response.data.length > 0) {
        // env data needs to be sorted with env that has isDeault true at the top
        envsData = response.data.sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return 0;
        });
      }
      yield put({
        type: ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS,
        payload: envsData,
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
