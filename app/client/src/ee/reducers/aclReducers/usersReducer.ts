import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { UserProps } from "@appsmith/pages/AdminSettings/AccessControl/types";
import { initialState, type AclReduxState } from ".";

export const userReducers = {
  [ReduxActionTypes.FETCH_ACL_USERS]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_USERS_ERROR]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USERS_SUCCESS]: (
    state: AclReduxState,
    action: ReduxAction<AclReduxState["users"]>,
  ) => ({
    ...state,
    users: {
      ...action.payload,
      total:
        action.payload.total < 0 ? state.users.total : action.payload.total,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USER_BY_ID]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_USER_BY_ID_ERROR]: (
    state: AclReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USER_BY_ID_SUCCESS]: (
    state: AclReduxState,
    action: any,
  ) => ({
    ...state,
    selectedUser: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_USER]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CREATE_ACL_USER_ERROR]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_USER_SUCCESS]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ROLES_IN_USER]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ROLES_IN_USER_SUCCESS]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_ROLES_IN_USER_ERROR]: (
    state: AclReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_GROUPS_IN_USER]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_GROUPS_IN_USER_SUCCESS]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_GROUPS_IN_USER_ERROR]: (
    state: AclReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.DELETE_ACL_USER_ERROR]: (state: AclReduxState) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER_SUCCESS]: (
    state: AclReduxState,
    action: any,
  ) => ({
    ...state,
    users: {
      ...state.users,
      content: state.users.content.filter(
        (user: UserProps) => user.id !== action.payload.id,
      ),
    },
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE]: (state: AclReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ROLES_GROUPS_FOR_INVITE_ERROR]: (
    state: AclReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE_SUCCESS]: (
    state: AclReduxState,
    action: any,
  ) => ({
    ...state,
    inviteOptions: {
      ...state.inviteOptions,
      roles: action.payload.roles,
      groups: action.payload.groups,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.RESET_USERS_DATA]: (state: AclReduxState) => ({
    ...state,
    selectedUser: null,
    users: initialState.users,
    isLoading: false,
  }),
};
