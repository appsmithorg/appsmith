export * from "ce/reducers/uiReducers/applicationsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ApplicationsReduxState } from "ce/reducers/uiReducers/applicationsReducer";
import {
  initialState,
  handlers as CE_handlers,
} from "ce/reducers/uiReducers/applicationsReducer";
import type {
  Workspaces,
  WorkspaceUser,
} from "@appsmith/constants/workspaceConstants";
import { createReducer } from "utils/ReducerUtils";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.INVITED_USERS_TO_WORKSPACE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      workspaceId: string;
      users: WorkspaceUser[];
      groups: WorkspaceUser[];
    }>,
  ) => {
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.workspaceId) {
        const users = workspace.users;
        workspace.users = [
          ...users,
          ...action.payload.users,
          ...action.payload.groups,
        ];
        return {
          ...workspace,
        };
      }
      return workspace;
    });

    return {
      ...state,
      userWorkspaces: _workspaces,
    };
  },
};

const applicationsReducer = createReducer(initialState, handlers);

export default applicationsReducer;
