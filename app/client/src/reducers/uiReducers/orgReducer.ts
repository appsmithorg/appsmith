import { createReducer } from "utils/AppsmithUtils";
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
  },
  currentOrgId: "",
  orgUsers: [],
  orgRoles: [],
};

const orgReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_ORG_ROLES_INIT]: (state: OrgReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: true,
    },
  }),
  [ReduxActionTypes.FETCH_ALL_ROLES_INIT]: (state: OrgReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      isFetchAllRoles: true,
    },
  }),
  [ReduxActionTypes.FETCH_ALL_USERS_INIT]: (state: OrgReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      isFetchAllUsers: true,
    },
  }),

  [ReduxActionTypes.FETCH_ORG_ROLES_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<OrgRole[]>,
  ) => ({
    ...state,
    roles: action.payload,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: false,
    },
  }),
  [ReduxActionErrorTypes.FETCH_ORG_ROLES_ERROR]: (state: OrgReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: false,
    },
  }),
  [ReduxActionTypes.FETCH_ALL_USERS_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<Org[]>,
  ) => ({
    ...state,
    orgUsers: action.payload,
    loadingStates: {
      ...state.loadingStates,
      isFetchAllUsers: false,
    },
  }),
  [ReduxActionTypes.FETCH_ALL_ROLES_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<Org[]>,
  ) => ({
    ...state,
    orgRoles: action.payload,
    loadingStates: {
      ...state.loadingStates,
      isFetchAllRoles: false,
    },
  }),
  [ReduxActionTypes.CHANGE_ORG_USER_ROLE_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<{ username: string; roleName: string }>,
  ) => {
    const _orgUsers = state.orgUsers.map((user: OrgUser) => {
      if (user.username === action.payload.username) {
        return {
          ...user,
          roleName: action.payload.roleName,
          isChangingRole: false,
        };
      }
      return user;
    });
    return {
      ...state,
      orgUsers: _orgUsers,
    };
  },
  [ReduxActionTypes.CHANGE_ORG_USER_ROLE_INIT]: (
    state: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    const _orgUsers = state.orgUsers.map((user: OrgUser) => {
      if (user.username == action.payload.username) {
        return {
          ...user,
          isChangingRole: true,
        };
      }
      return user;
    });
    return { ...state, orgUsers: _orgUsers };
  },
  [ReduxActionTypes.DELETE_ORG_USER_INIT]: (
    state: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    const _orgUsers = state.orgUsers.map((user: OrgUser) => {
      if (user.username == action.payload.username) {
        return {
          ...user,
          isDeleting: true,
        };
      }
      return user;
    });
    return { ...state, orgUsers: _orgUsers };
  },
  [ReduxActionTypes.DELETE_ORG_USER_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    const _orgUsers = state.orgUsers.filter(
      (user: OrgUser) => user.username !== action.payload.username,
    );
    return {
      ...state,
      orgUsers: _orgUsers,
    };
  },
  [ReduxActionTypes.CHANGE_ORG_USER_ROLE_ERROR]: (state: OrgReduxState) => {
    const _orgUsers = state.orgUsers.map(user => ({
      ...user,
      isChangingRole: false,
    }));
    return { ...state, orgUsers: _orgUsers };
  },
  [ReduxActionTypes.DELETE_ORG_USER_ERROR]: (state: OrgReduxState) => {
    const _orgUsers = state.orgUsers.map(user => ({
      ...user,
      isDeleting: false,
    }));
    return { ...state, orgUsers: _orgUsers };
  },
  [ReduxActionTypes.SET_CURRENT_ORG_ID]: (
    state: OrgReduxState,
    action: ReduxAction<{ orgId: string }>,
  ) => ({
    ...state,
    currentOrgId: action.payload.orgId,
  }),

  [ReduxActionTypes.FETCH_ORGS_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<Org[]>,
  ) => ({
    ...state,
    list: action.payload,
  }),
});

export interface OrgReduxState {
  list?: Org[];
  roles?: OrgRole[];
  loadingStates: {
    fetchingRoles: boolean;
    isFetchAllRoles: boolean;
    isFetchAllUsers: boolean;
  };
  orgUsers: OrgUser[];
  orgRoles: any;
  currentOrgId: string;
}

export default orgReducer;
