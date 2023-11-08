export * from "ce/reducers/uiReducers/workspaceReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/uiReducers/workspaceReducer";
import type { WorkspaceReduxState as CE_WorkspaceReduxState } from "ce/reducers/uiReducers/workspaceReducer";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";
import type {
  WorkspaceUser,
  WorkspaceUserRoles,
} from "@appsmith/constants/workspaceConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import type {
  PackageMetadata,
  Package,
} from "@appsmith/constants/PackageConstants";
import type {
  CreatePackageFromWorkspacePayload,
  DeletePackagePayload,
} from "@appsmith/actions/packageActions";

export const initialState: WorkspaceReduxState = {
  ...CE_initialState,
  groupSuggestions: [],

  loadingStates: {
    ...CE_initialState.loadingStates,
    isFetchingPackagesList: false,
    packageCreationRequestMap: {},
  },
  packagesList: [],
  isSavingPkgName: false,
  isErrorSavingPkgName: false,
};

type ID = string;

type LoadingStates = CE_WorkspaceReduxState["loadingStates"] & {
  isFetchingPackagesList: boolean;
  packageCreationRequestMap: Record<ID, boolean>;
};

type FilteredCE_WorkspaceRedux = Omit<CE_WorkspaceReduxState, "loadingStates">;

export interface GroupSuggestions {
  id: string;
  name: string;
}
export interface WorkspaceReduxState extends FilteredCE_WorkspaceRedux {
  groupSuggestions: GroupSuggestions[];
  loadingStates: LoadingStates;
  packagesList: PackageMetadata[];
  isSavingPkgName: boolean;
  isErrorSavingPkgName: boolean;
}

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.roles = user.roles.map((ur: any) => {
          if (
            ur.entityType === action.payload.roles[0]?.entityType &&
            ur.entityId === action.payload.roles[0]?.entityId
          ) {
            return action.payload.roles[0];
          } else {
            return ur;
          }
        });
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.roles = user.roles.map((ur: any) => {
          if (
            ur.entityType === action.payload.roles[0]?.entityType &&
            ur.entityId === action.payload.roles[0]?.entityId
          ) {
            return {
              ...ur,
              ...action.payload.roles[0],
            };
          } else {
            return ur;
          }
        });
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionErrorTypes.CHANGE_APPLICATION_USER_ROLE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_APPLICATION_USER_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers = draftState.workspaceUsers
      .map((user: WorkspaceUser) => {
        if (
          action.payload.userGroupId
            ? user.userGroupId === action.payload.userGroupId
            : user.username === action.payload.username
        ) {
          if (user.roles.length === 1) {
            user.roles = [];
          } else {
            user.roles[0] = {
              entityType: ENTITY_TYPE.WORKSPACE,
              autoCreated: false,
            };
          }
        }
        user.isDeleting = false;
        return user;
      })
      .filter((user: WorkspaceUser) => user.roles.length !== 0);
  },
  [ReduxActionTypes.DELETE_APPLICATION_USER_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      username: string;
      userGroupId: string;
      applicationId: string;
    }>,
  ) => {
    draftState.workspaceUsers = draftState.workspaceUsers
      .map((user: WorkspaceUser) => {
        if (
          action.payload.userGroupId
            ? user.userGroupId === action.payload.userGroupId
            : user.username === action.payload.username
        ) {
          user.roles = user.roles.filter(
            (ur: any) => ur.entityId !== action.payload.applicationId,
          );
          if (
            user.roles.length === 1 &&
            user.roles[0].entityType === ENTITY_TYPE.WORKSPACE &&
            !user.roles[0].name
          ) {
            user.roles = [];
          }
        }
        user.isDeleting = false;
        return user;
      })
      .filter((user: WorkspaceUser) => user.roles.length !== 0);
  },
  [ReduxActionErrorTypes.DELETE_APPLICATION_USER_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
  },
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
  [ReduxActionTypes.FETCH_ALL_PACKAGES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = true;

    return draftState;
  },
  [ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = false;

    return draftState;
  },
  [ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<PackageMetadata[]>,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = false;

    draftState.packagesList = action.payload || [];

    return draftState;
  },
  [ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<CreatePackageFromWorkspacePayload>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = true;

    return draftState;
  },
  [ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Package>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionTypes.DELETE_PACKAGE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<DeletePackagePayload>,
  ) => {
    const { id } = action.payload;
    const index = draftState.packagesList.findIndex((p) => p.id === id);
    if (index !== -1) draftState.packagesList.splice(index, 1);

    return draftState;
  },
  [ReduxActionTypes.UPDATE_PACKAGE_INIT]: (draftState: WorkspaceReduxState) => {
    return {
      ...draftState,
      isSavingPkgName: true,
      isErrorSavingPkgName: false,
    };
  },
  [ReduxActionTypes.UPDATE_PACKAGE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Package>,
  ) => {
    const pkg = action.payload;
    const index = draftState.packagesList.findIndex((p) => p.id === pkg.id);
    if (index !== -1) draftState.packagesList[index] = pkg;
    draftState.isSavingPkgName = false;
    draftState.isErrorSavingPkgName = false;

    return draftState;
  },
  [ReduxActionErrorTypes.UPDATE_PACKAGE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    return {
      ...draftState,
      isSavingPkgName: false,
      isErrorSavingPkgName: true,
    };
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
