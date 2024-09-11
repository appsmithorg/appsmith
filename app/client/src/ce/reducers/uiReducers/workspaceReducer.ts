import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { WorkspaceRole, Workspace } from "ee/constants/workspaceConstants";

export interface WorkspaceReduxState {
  list: Workspace[];
  roles?: WorkspaceRole[];
  loadingStates: {
    isFetchAllRoles: boolean;
    isSavingWorkspaceInfo: boolean;
    isFetchingWorkspaces: boolean;
    isFetchingEntities: boolean;
    isDeletingWorkspace: boolean;
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaceRoles: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchEntities: any;
}

export const initialState: WorkspaceReduxState = {
  loadingStates: {
    isFetchAllRoles: false,
    isSavingWorkspaceInfo: false,
    isFetchingWorkspaces: false,
    isFetchingEntities: false,
    isDeletingWorkspace: false,
  },
  list: [],
  workspaceRoles: [],
  searchEntities: {},
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
  [ReduxActionTypes.DELETE_WORKSPACE_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isDeletingWorkspace = true;
  },
  [ReduxActionTypes.DELETE_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<string>,
  ) => {
    draftState.list = draftState.list.filter(
      (workspace: Workspace) => workspace.id !== action.payload,
    );
    draftState.loadingStates.isDeletingWorkspace = false;
  },
  [ReduxActionErrorTypes.DELETE_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isDeletingWorkspace = false;
  },
  [ReduxActionTypes.SAVE_WORKSPACE_INIT]: (draftState: WorkspaceReduxState) => {
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
