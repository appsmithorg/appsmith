export * from "ce/reducers/uiReducers/workspaceReducer";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/uiReducers/workspaceReducer";
import {
  Workspace,
  WorkspaceRole,
  WorkspaceUser,
} from "@appsmith/constants/workspaceConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export const initialState: WorkspaceReduxState = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingWorkspace: false,
  },
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
  groupSuggestions: [],
};

export interface WorkspaceReduxState {
  list?: Workspace[];
  roles?: WorkspaceRole[];
  loadingStates: {
    fetchingRoles: boolean;
    isFetchAllRoles: boolean;
    isFetchAllUsers: boolean;
    isFetchingWorkspace: boolean;
  };
  workspaceUsers: WorkspaceUser[];
  workspaceRoles: any;
  currentWorkspace: Workspace;
  groupSuggestions: { id: string; name: string }[];
}

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_GROUP_SUGGESTIONS_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<any>,
  ) => {
    draftState.groupSuggestions = action.payload;
  },
  [ReduxActionErrorTypes.FETCH_GROUP_SUGGESTIONS_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.groupSuggestions = [];
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
