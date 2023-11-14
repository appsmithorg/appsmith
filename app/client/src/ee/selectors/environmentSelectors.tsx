export * from "ce/selectors/environmentSelectors";
import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { AppState } from "@appsmith/reducers";
import type { EnvironmentType } from "@appsmith/configs/types";
import { getFilteredEnvListWithPermissions } from "@appsmith/utils/Environments";
import { hasManageWorkspaceEnvironmentPermission } from "@appsmith/utils/permissionHelpers";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import { getHasManageWorkspaceDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { getCurrentAppWorkspace } from "./workspaceSelectors";
import { onCanvas } from "components/editorComponents/Debugger/helpers";
import { matchDatasourcePath } from "constants/routes";
import { isDatasourceInViewMode } from "selectors/ui";

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

// Conditions to show the env walkthrough
// 1. Walkthrough is not shown before
// 2. The feature flag for release datasource environments is enabled
// 3. The feature flag for the env walkthrough is enabled
// 4. User should have edit datasource permissions
// 5. There should be no datasources with staging environment configured
// 6. For step 1, the user should be on the canvas page and for step 2, the user should be on the datasource page with edit mode enabled
export const renderEnvWalkthrough = (state: AppState, step = 1) => {
  // Check 1 is done in the component itself (since it is an async function call)

  // Check 2
  const isFlagEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  if (!isFlagEnabled) return false;

  // Check 3
  const isEnvWalkthroughEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.ab_env_walkthrough_enabled,
  );
  if (!isEnvWalkthroughEnabled) return false;

  // Check 4
  const isGACEnabledFlag = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.license_gac_enabled,
  );

  const userWorkspacePermissions =
    getCurrentAppWorkspace(state).userPermissions ?? [];

  const canManageDatasource = getHasManageWorkspaceDatasourcePermission(
    isGACEnabledFlag,
    userWorkspacePermissions,
  );
  if (!canManageDatasource) return false;

  // Check 5
  const environments = getEnvironments(state);
  const stagingEnvDetails = environments.find((env) => env.name === "Staging");
  if (
    !stagingEnvDetails ||
    !stagingEnvDetails.datasourceMeta ||
    !stagingEnvDetails.datasourceMeta.hasOwnProperty("configuredDatasources")
  )
    return false;
  if (stagingEnvDetails.datasourceMeta?.configuredDatasources > 0) return false;

  // Check 6
  if (step === 1 && onCanvas()) return true;

  const isDatasourceViewMode = isDatasourceInViewMode(state);
  if (
    step === 2 &&
    !!matchDatasourcePath(window.location.pathname) &&
    !isDatasourceViewMode
  )
    return true;

  return false;
};
