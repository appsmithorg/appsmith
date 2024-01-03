import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import type { ApiResponse } from "api/ApiResponses";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import EnvironmentApi from "@appsmith/api/EnvironmentApi";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import type { CurrentEnvironmentDetails } from "@appsmith/reducers/environmentReducer";
import type { EnvironmentType } from "@appsmith/configs/types";
import {
  ENVIRONMENT_QUERY_KEY,
  getFilteredEnvListWithPermissions,
} from "@appsmith/utils/Environments";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { toast } from "design-system";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  getSavedCurrentEnvironmentDetails,
  resetCurrentEnvironment,
  saveCurrentEnvironment,
} from "utils/storage";
import { getEnvironments } from "@appsmith/selectors/environmentSelectors";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { isMultipleEnvEnabled } from "@appsmith/utils/planHelpers";

export const LOCKED_ENVIRONMENTS_ENUM = ["production", "staging"];

const fetchStoredEnv = (
  envs: EnvironmentType[],
  storedEnvDetails: { appId: string; envId: string },
  appId: string,
) => {
  // if the env is already set in the indexDb is not from same app, override it
  if (storedEnvDetails.appId.length > 0 && storedEnvDetails.appId !== appId)
    return undefined;

  const storedEnvId = storedEnvDetails.envId;

  // check if this id is present in the incoming payload
  const storedEnv = envs.find((env: EnvironmentType) => env.id === storedEnvId);

  if (!!storedEnv) {
    return storedEnv;
  }

  return undefined;
};

// Saga to handle fetching the environment configs
function* FetchEnvironmentsInitSaga(
  action: ReduxAction<{
    workspaceId: string;
    fetchDatasourceMeta?: boolean;
  }>,
) {
  try {
    const response: ApiResponse<EnvironmentType[]> = yield call(
      EnvironmentApi.fetchEnvironmentConfigs,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const queryParams = new URLSearchParams(window.location.search);

      // list of env for which execute permission is present
      const executableEnvs = getFilteredEnvListWithPermissions(response.data);

      // Get current application ID
      const appId: string = yield select(getCurrentApplicationId);

      // Prepare current environment details
      let currentEnvData: CurrentEnvironmentDetails = {
        id: "",
        name: "",
        appId,
        workspaceId: action.payload.workspaceId,
        editingId: "",
      };

      // if there are no executable environments then remove the current environment from localstorage and query param.
      if (executableEnvs.length === 0) {
        resetCurrentEnvironment();
        queryParams.delete(ENVIRONMENT_QUERY_KEY);
        window.history.replaceState({}, "", "?" + queryParams.toString());
      } else {
        const defaultEnvironment = executableEnvs.find(
          (env: EnvironmentType) => env.isDefault,
        );

        const featureFlags: FeatureFlags = yield select(selectFeatureFlags);

        // if default env is present, use it as the selected env, else use the first env present
        const selectedEnv = defaultEnvironment
          ? defaultEnvironment
          : executableEnvs[0];

        // check indexDb if the default environment is already set
        const storedEnvDetails: { appId: string; envId: string } =
          yield getSavedCurrentEnvironmentDetails() || { appId: "", envId: "" };

        // Check if there was any environment set in previous session and if it is valid for current session.
        // If not, update the environemnt to selected environment.
        const storedEnv = fetchStoredEnv(
          executableEnvs,
          storedEnvDetails,
          appId,
        );
        if (!storedEnv) {
          // Save the current environment details in indexDb
          saveCurrentEnvironment(selectedEnv.id, appId);
          if (isMultipleEnvEnabled(featureFlags)) {
            // Set new if there is no query param
            queryParams.set(
              ENVIRONMENT_QUERY_KEY,
              selectedEnv.name.toLowerCase(),
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
          // update the current environment details to be stored in redux
          currentEnvData = {
            ...currentEnvData,
            id: selectedEnv.id,
            name: selectedEnv.name,
            editingId: selectedEnv.id,
          };
        } else {
          // update the current environment details to be stored in redux
          currentEnvData = {
            ...currentEnvData,
            id: storedEnv.id,
            name: storedEnv.name,
            editingId: storedEnv.id,
          };
        }
      }
      let envsData: Array<EnvironmentType> = [];
      if (!!response.data && response.data.length > 0) {
        // We need to check if the name is present in locked list, if yes, then we need to set the isLocked
        // flag to true (which disables editing and deleting of the env)
        envsData = response.data.map((env: EnvironmentType) => {
          if (
            env.name &&
            env.name.length > 0 &&
            LOCKED_ENVIRONMENTS_ENUM.includes(env.name.toLowerCase())
          ) {
            return {
              ...env,
              isLocked: true,
            };
          }
          return {
            ...env,
            isLocked: false,
          };
        });
      }
      yield put({
        type: ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS,
        payload: { envsData, currentEnvData },
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
  // fetch the envs for the workspace, sending fetchDatasourceMeta as true to fetch the info about the configured envs (for showing walkthrough)
  yield put(fetchingEnvironmentConfigs(workspaceId, true));
}

// Saga to handle creating a new environment
function* createEnvironmentSaga(
  action: ReduxAction<{
    environmentName: string;
    workspaceId: string;
  }>,
) {
  try {
    const response: ApiResponse<EnvironmentType> = yield call(
      EnvironmentApi.createEnvironment,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_ENVIRONMENT_SUCCESS,
        payload: response.data,
      });
      toast.show(`Environment ${response.data.name} created successfully`, {
        kind: "success",
      });
    } else {
      yield put({
        type: ReduxActionTypes.CREATE_ENVIRONMENT_FAILED,
        payload: response?.responseMeta,
      });
      toast.show(`Environment creation failed`, {
        kind: "error",
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.CREATE_ENVIRONMENT_FAILED,
      payload: {
        error: "failed",
      },
    });
    toast.show(`Environment creation failed`, {
      kind: "error",
    });
  }
}

// Saga to handle updating an existing environment
function* updateEnvironmentSaga(
  action: ReduxAction<{
    newEnvironmentName: string;
    environmentId: string;
  }>,
) {
  try {
    const response: ApiResponse<EnvironmentType> = yield call(
      EnvironmentApi.updateEnvironment,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ENVIRONMENT_SUCCESS,
        payload: response.data,
      });
      toast.show(
        `Environment ${action.payload.newEnvironmentName} updated successfully`,
        {
          kind: "success",
        },
      );
    } else {
      yield put({
        type: ReduxActionTypes.UPDATE_ENVIRONMENT_FAILED,
        payload: response?.responseMeta,
      });
      toast.show(`Environment updation failed`, {
        kind: "error",
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.UPDATE_ENVIRONMENT_FAILED,
      payload: {
        error: "failed",
      },
    });
    toast.show(`Environment updation failed`, {
      kind: "error",
    });
  }
}

// Saga to handle deleting an existing environment
function* deleteEnvironmentSaga(
  action: ReduxAction<{
    environmentId: string;
  }>,
) {
  try {
    const response: ApiResponse<EnvironmentType> = yield call(
      EnvironmentApi.deleteEnvironment,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ENVIRONMENT_SUCCESS,
        payload: response.data,
      });
      toast.show(`Environment deleted successfully`, {
        kind: "success",
      });
    } else {
      yield put({
        type: ReduxActionTypes.DELETE_ENVIRONMENT_FAILED,
        payload: response?.responseMeta,
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.DELETE_ENVIRONMENT_FAILED,
      payload: {
        error: "failed",
      },
    });
    toast.show(`Environment deletion failed`, {
      kind: "error",
    });
  }
}

export function* waitForFetchEnvironments() {
  const environments: EnvironmentType[] | undefined =
    yield select(getEnvironments);
  if (environments?.length === 0) {
    yield race([
      take(ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS),
      take(ReduxActionTypes.FETCH_ENVIRONMENT_FAILED),
    ]);
  }
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
    takeLatest(ReduxActionTypes.CREATE_ENVIRONMENT_INIT, createEnvironmentSaga),
    takeLatest(ReduxActionTypes.UPDATE_ENVIRONMENT_INIT, updateEnvironmentSaga),
    takeLatest(ReduxActionTypes.DELETE_ENVIRONMENT_INIT, deleteEnvironmentSaga),
  ]);
}
