export * from "ce/utils/workspaceHelpers";
import { fetchAllWorkflowsForWorkspace } from "@appsmith/actions/workflowActions";
import { fetchAllApplicationsOfWorkspace } from "@appsmith/actions/applicationActions";
import { fetchUsersForWorkspace } from "@appsmith/actions/workspaceActions";
import type { AnyAction, Dispatch } from "redux";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

interface FetchWorkspaceEntitiesParams {
  activeWorkspaceId: string;
  dispatch: Dispatch<AnyAction>;
  featureFlags?: FeatureFlags;
}

export const fetchWorkspaceEntities = ({
  activeWorkspaceId,
  dispatch,
  featureFlags,
}: FetchWorkspaceEntitiesParams) => {
  const { cloudHosting } = getAppsmithConfigs();
  dispatch(fetchAllApplicationsOfWorkspace(activeWorkspaceId));
  dispatch(fetchUsersForWorkspace(activeWorkspaceId));
  if (!cloudHosting && featureFlags?.release_workflows_enabled) {
    dispatch(fetchAllWorkflowsForWorkspace(activeWorkspaceId));
  }
};

export const getWorkspaceEntitiesActions = (workspaceId: string = "") => {
  const initActions = [
    fetchAllApplicationsOfWorkspace(workspaceId),
    fetchAllWorkflowsForWorkspace(workspaceId),
    fetchUsersForWorkspace(workspaceId),
  ];

  const successActions = [
    ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS,
    ReduxActionTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_SUCCESS,
    ReduxActionTypes.FETCH_ALL_USERS_SUCCESS,
  ];

  const errorActions = [
    ReduxActionErrorTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_ERROR,
    ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_ERROR,
    ReduxActionErrorTypes.FETCH_ALL_USERS_ERROR,
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
