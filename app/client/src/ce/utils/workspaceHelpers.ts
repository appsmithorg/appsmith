import { fetchAllApplicationsOfWorkspace } from "ee/actions/applicationActions";
import { fetchUsersForWorkspace } from "ee/actions/workspaceActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";

export const getWorkspaceEntitiesActions = (workspaceId: string = "") => {
  const initActions = [
    fetchAllApplicationsOfWorkspace(workspaceId),
    fetchUsersForWorkspace(workspaceId),
  ];

  const successActions = [
    ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS,
    ReduxActionTypes.FETCH_ALL_USERS_SUCCESS,
  ];

  const errorActions = [
    ReduxActionErrorTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_ERROR,
    ReduxActionErrorTypes.FETCH_ALL_USERS_ERROR,
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};

/**
 * Checks if the current context is a workspace context
 * by checking if the pathname starts with /workspace
 *
 * @returns true if pathname starts with /workspace
 */
export const isWorkspaceContext = (): boolean => {
  return window.location.pathname.startsWith("/workspace");
};
