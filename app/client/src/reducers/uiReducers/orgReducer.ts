import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { OrgRole, Org, OrgUser } from "constants/orgConstants";

const initialState: OrgReduxState = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingOrg: false,
  },
  orgUsers: [],
  orgRoles: [],
  currentOrg: {
    id: "",
    name: "",
  },
};

const orgReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_ORG_ROLES_INIT]: (draftState: OrgReduxState) => {
    draftState.loadingStates.isFetchAllRoles = true;
  },
  [ReduxActionTypes.FETCH_ALL_ROLES_INIT]: (draftState: OrgReduxState) => {
    draftState.loadingStates.isFetchAllRoles = true;
  },
  [ReduxActionTypes.FETCH_ALL_USERS_INIT]: (draftState: OrgReduxState) => {
    draftState.loadingStates.isFetchAllUsers = true;
  },
  [ReduxActionTypes.FETCH_ORG_ROLES_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<OrgRole[]>,
  ) => {
    draftState.orgRoles = action.payload;
    draftState.loadingStates.fetchingRoles = false;
  },
  [ReduxActionErrorTypes.FETCH_ORG_ROLES_ERROR]: (
    draftState: OrgReduxState,
  ) => {
    draftState.loadingStates.fetchingRoles = false;
  },
  [ReduxActionTypes.FETCH_ALL_USERS_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<OrgUser[]>,
  ) => {
    draftState.orgUsers = action.payload;
    draftState.loadingStates.isFetchAllUsers = false;
  },
  [ReduxActionTypes.FETCH_ALL_ROLES_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<Org[]>,
  ) => {
    draftState.orgRoles = action.payload;
    draftState.loadingStates.isFetchAllRoles = false;
  },
  [ReduxActionTypes.CHANGE_ORG_USER_ROLE_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<{ username: string; roleName: string }>,
  ) => {
    draftState.orgUsers.forEach((user: OrgUser) => {
      if (user.username === action.payload.username) {
        user.roleName = action.payload.roleName;
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_ORG_USER_ROLE_INIT]: (
    draftState: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.orgUsers.forEach((user: OrgUser) => {
      if (user.username === action.payload.username) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionErrorTypes.CHANGE_ORG_USER_ROLE_ERROR]: (
    draftState: OrgReduxState,
  ) => {
    draftState.orgUsers.forEach((user: OrgUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
    });
  },
  [ReduxActionTypes.DELETE_ORG_USER_INIT]: (
    draftState: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.orgUsers.forEach((user: OrgUser) => {
      if (user.username === action.payload.username) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_ORG_USER_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.orgUsers = draftState.orgUsers.filter(
      (user: OrgUser) => user.username !== action.payload.username,
    );
  },
  [ReduxActionErrorTypes.DELETE_ORG_USER_ERROR]: (
    draftState: OrgReduxState,
  ) => {
    draftState.orgUsers.forEach((user: OrgUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
  },
  [ReduxActionTypes.SET_CURRENT_ORG_ID]: (
    draftState: OrgReduxState,
    action: ReduxAction<{ orgId: string }>,
  ) => {
    draftState.currentOrg.id = action.payload.orgId;
  },
  [ReduxActionTypes.SET_CURRENT_ORG]: (
    draftState: OrgReduxState,
    action: ReduxAction<Org>,
  ) => {
    draftState.currentOrg = action.payload;
  },
  [ReduxActionTypes.FETCH_CURRENT_ORG]: (draftState: OrgReduxState) => {
    draftState.loadingStates.isFetchingOrg = true;
  },
  [ReduxActionTypes.FETCH_ORG_SUCCESS]: (
    draftState: OrgReduxState,
    action: ReduxAction<Org>,
  ) => {
    draftState.currentOrg = action.payload;
    draftState.loadingStates.isFetchingOrg = false;
  },
  [ReduxActionErrorTypes.FETCH_ORG_ERROR]: (draftState: OrgReduxState) => {
    draftState.loadingStates.isFetchingOrg = false;
  },
});

export interface OrgReduxState {
  list?: Org[];
  roles?: OrgRole[];
  loadingStates: {
    fetchingRoles: boolean;
    isFetchAllRoles: boolean;
    isFetchAllUsers: boolean;
    isFetchingOrg: boolean;
  };
  orgUsers: OrgUser[];
  orgRoles: any;
  currentOrg: Org;
}

export default orgReducer;
