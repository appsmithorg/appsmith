import { createImmerReducer } from "utils/ReducerUtils";
import type { User } from "constants/userConstants";
import type {
  ApplicationPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { UpdateApplicationRequest } from "@appsmith/api/ApplicationApi";

export interface SelectedWorkspaceReduxState {
  workspace: Workspace | null;
  applications: ApplicationPayload[];
  users: User[];
  packages: Package[];
  loadingStates: {
    isFetchingApplications: boolean;
  };
}

export const initialState: SelectedWorkspaceReduxState = {
  workspace: null,
  applications: [],
  users: [],
  packages: [],
  loadingStates: {
    isFetchingApplications: false,
  },
};

export const handlers = {
  [ReduxActionTypes.FETCH_WORKSPACE_ROLES_INIT]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.workspace = null;
  },

  [ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_INIT]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingApplications = true;
  },

  [ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<ApplicationPayload[]>,
  ) => {
    draftState.loadingStates.isFetchingApplications = false;
    draftState.applications = action.payload;
  },
  [ReduxActionTypes.DELETE_MULTIPLE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<ApplicationPayload[]>,
  ) => {
    const deletedApplicationIds = action.payload.map((app) => app.id);
    const applications = draftState.applications.filter(
      (app) => !deletedApplicationIds.includes(app.id),
    );
    draftState.applications = applications;
  },
  [ReduxActionTypes.DELETE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    const applications = draftState.applications.filter(
      (application: ApplicationPayload) => application.id !== action.payload.id,
    );
    draftState.applications = [...applications];
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    const applications = draftState.applications;
    applications.push(action.payload.application);
    draftState.applications = [...applications];
  },
  [ReduxActionTypes.FORK_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    draftState.applications = [
      ...draftState.applications,
      action.payload.application,
    ];
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    // userWorkspaces data has to be saved to localStorage only if the action is successful
    // It introduces bug if we prematurely save it during init action.
    const { id, ...rest } = action.payload;
    const applications = draftState.applications;

    const appIndex = draftState.applications.findIndex((app) => app.id === id);
    if (appIndex !== -1) {
      applications[appIndex] = {
        ...applications[appIndex],
        ...rest,
      };
    }
    draftState.applications = [...applications];
  },
};

const selectedWorkspaceReducer = createImmerReducer(initialState, handlers);

export default selectedWorkspaceReducer;
