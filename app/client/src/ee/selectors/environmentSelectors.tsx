export * from "ce/selectors/environmentSelectors";
import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { AppState } from "@appsmith/reducers";
import type { EnvironmentType } from "@appsmith/configs/types";
import { getFilteredEnvListWithPermissions } from "@appsmith/utils/Environments";
import { hasManageWorkspaceEnvironmentPermission } from "@appsmith/utils/permissionHelpers";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";

export const getEnvironmentByName = (state: AppState, name: string) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.name === name);
  return environment;
};

export const getEnvironmentById = (state: AppState, id: string) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.id === id);
  return environment;
};

export const getEnvironmentIdByName = (state: AppState, name: string) => {
  if (name === DEFAULT_ENV_ID) return name;
  const environments = state.environments.data;
  const environment = environments.find((env) => env.name === name);
  return environment?.id || DEFAULT_ENV_ID;
};

export const getDefaultEnvironmentId = (state: AppState) => {
  const environments = state.environments.data;
  if (!environments || environments.length === 0) return DEFAULT_ENV_ID;
  const environment = environments.find((env) => env.isDefault === true);
  return environment?.id || environments[0].id;
};

export const getDefaultEnvironment = (state: AppState) => {
  const environments = getEnvironmentsWithPermission(state);
  const environment = environments.find((env) => env.isDefault === true);
  return environment;
};

export const getEnvironments = (state: AppState): Array<EnvironmentType> =>
  state.environments.data;

export const getEnvironmentsWithPermission = (
  state: AppState,
): Array<EnvironmentType> =>
  getFilteredEnvListWithPermissions(getEnvironments(state));

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  state.environments.data.length > 0 &&
  state.environments.data[0].workspaceId === workspaceId;

export const getCurrentEnvironmentId = (state: AppState) =>
  state.environments.currentEnvironmentDetails.id || "unused_env";

export const getCurrentEnvironmentName = (state: AppState) =>
  state.environments.currentEnvironmentDetails.name || "";

export const getCurrentEditingEnvironmentId = (state: AppState) =>
  state.environments.currentEnvironmentDetails.editingId || "unused_env";

export const getCurrentEnvironmentDetails = (state: AppState) =>
  state.environments.currentEnvironmentDetails;

export const isEnvironmentFetching = (state: AppState) =>
  state.environments.isLoading;

export const isEnvironmentUpdating = (state: AppState) =>
  state.environments.isUpdating;

export const allowManageEnvironmentAccessForUser = (state: AppState) => {
  const isFlagEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.license_custom_environments_enabled,
  );
  return isFlagEnabled;
};

export const allowManageEnvironmentAccessForWorkspace = (
  state: AppState,
  workspacePermissions: string[],
) => {
  const checkUserAccess = allowManageEnvironmentAccessForUser(state);
  const hasWorkspaceManageEnvPermission =
    hasManageWorkspaceEnvironmentPermission(workspacePermissions);

  return checkUserAccess && hasWorkspaceManageEnvPermission;
};
