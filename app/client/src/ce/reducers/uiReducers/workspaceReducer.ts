import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type {
  WorkspaceRole,
  Workspace,
} from "@appsmith/constants/workspaceConstants";

export interface WorkspaceReduxState {
  list: Workspace[];
  roles?: WorkspaceRole[];
  loadingStates: {
    isFetchAllRoles: boolean;
    isFetchingCurrentWorkspace: boolean;
    isSavingWorkspaceInfo: boolean;
    isFetchingWorkspaces: boolean;
    isFetchingEntities: boolean;
  };
  workspaceRoles: any;
  currentWorkspace: Workspace;
  searchEntities: any;
}

export const initialState: WorkspaceReduxState = {
  loadingStates: {
    isFetchAllRoles: false,
    isFetchingCurrentWorkspace: false,
    isSavingWorkspaceInfo: false,
    isFetchingWorkspaces: false,
    isFetchingEntities: false,
  },
  list: [],
  workspaceRoles: [],
  searchEntities: {},
  currentWorkspace: {
    id: "",
    name: "",
  },
};

export const handlers = {
  [ReduxActionTypes.FETCH_ALL_ROLES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchAllRoles = true;
  },
  [ReduxActionTypes.FETCH_ALL_ROLES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace[]>,
  ) => {
    draftState.workspaceRoles = action.payload;
    draftState.loadingStates.isFetchAllRoles = false;
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE_ID]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    draftState.currentWorkspace.id = action.payload.workspaceId;
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.currentWorkspace = action.payload;
  },
  [ReduxActionTypes.RESET_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.currentWorkspace = {
      id: "",
      name: "",
    };
  },
  [ReduxActionTypes.FETCH_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = true;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.currentWorkspace = action.payload;
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
  [ReduxActionTypes.FETCH_ALL_WORKSPACES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkspaces = true;
  },
  [ReduxActionTypes.FETCH_ALL_WORKSPACES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace[]>,
  ) => {
    draftState.loadingStates.isFetchingWorkspaces = false;
    draftState.list = action.payload;
  },
  [ReduxActionTypes.DELETE_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<string>,
  ) => {
    draftState.list = draftState.list.filter(
      (workspace: Workspace) => workspace.id !== action.payload,
    );
  },
  [ReduxActionTypes.SAVING_WORKSPACE_INFO]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isSavingWorkspaceInfo = true;
  },
  [ReduxActionTypes.SAVE_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      id: string;
      name?: string;
      website?: string;
      email?: string;
      logoUrl?: string;
    }>,
  ) => {
    const workspaces = draftState.list;
    const workspaceIndex = draftState.list.findIndex(
      (workspace: Workspace) => workspace.id === action.payload.id,
    );

    if (workspaceIndex !== -1) {
      workspaces[workspaceIndex] = {
        ...workspaces[workspaceIndex],
        ...action.payload,
      };
    }
    draftState.loadingStates.isSavingWorkspaceInfo = false;
    draftState.list = [...workspaces];
  },
  [ReduxActionErrorTypes.SAVE_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isSavingWorkspaceInfo = false;
  },
  [ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_INIT]: (
    state: WorkspaceReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchingEntities: true,
      },
    };
  },
  [ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_SUCCESS]: (
    state: WorkspaceReduxState,
    action: ReduxAction<any>,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchingEntities: false,
      },
      searchEntities: action.payload,
    };
  },
  [ReduxActionErrorTypes.SEARCH_WORKSPACE_ENTITIES_ERROR]: (
    state: WorkspaceReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchingEntities: false,
      },
    };
  },
  [ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_RESET]: (
    state: WorkspaceReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchingEntities: false,
      },
      searchEntities: {},
    };
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
