export * from "ce/actions/environmentAction";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { CurrentEnvironmentDetails } from "@appsmith/reducers/environmentReducer";
import { saveCurrentEnvironment } from "utils/storage";

// Redux action to initiate fetching the environment configs
export const fetchingEnvironmentConfigs = (
  workspaceId: string,
  fetchDatasourceMeta = false,
) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
  payload: { workspaceId, fetchDatasourceMeta },
});

// Redux action to create a new environment
export const createNewEnvironment = (
  environmentName: string,
  workspaceId: string,
) => ({
  type: ReduxActionTypes.CREATE_ENVIRONMENT_INIT,
  payload: { environmentName, workspaceId },
});

// Redux action to update an existing environment
export const updateEnvironment = (
  newEnvironmentName: string,
  environmentId: string,
) => ({
  type: ReduxActionTypes.UPDATE_ENVIRONMENT_INIT,
  payload: { newEnvironmentName, environmentId },
});

// Redux action to delete an existing environment
export const deleteEnvironment = (environmentId: string) => ({
  type: ReduxActionTypes.DELETE_ENVIRONMENT_INIT,
  payload: { environmentId },
});

// Redux action to update the current environment details
export const setCurrentEnvironment = (
  currentEnvDetails: CurrentEnvironmentDetails,
) => {
  saveCurrentEnvironment(currentEnvDetails.id, currentEnvDetails.appId);
  return {
    type: ReduxActionTypes.SET_CURRENT_ENVIRONMENT,
    payload: currentEnvDetails,
  };
};

// Redux action to update the current editing environment ID
export const setCurrentEditingEnvironmentID = (currentEditingId: string) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_EDITING_ENVIRONMENT,
    payload: { currentEditingId },
  };
};
