import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { UserProps } from "@appsmith/pages/AdminSettings/AccessControl/types";

export const userReducers = {
  [ReduxActionTypes.FETCH_ACL_USERS]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_USERS_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USERS_SUCCESS]: (state: any, action: any) => ({
    ...state,
    users: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USER_BY_ID]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_USER_BY_ID_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_USER_BY_ID_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedUser: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CREATE_ACL_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_USER_SUCCESS]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ROLES_IN_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ROLES_IN_USER_SUCCESS]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_ROLES_IN_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_GROUPS_IN_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_GROUPS_IN_USER_SUCCESS]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_GROUPS_IN_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.DELETE_ACL_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER_SUCCESS]: (state: any, action: any) => ({
    ...state,
    users: state.users.filter(
      (user: UserProps) => user.id !== action.payload.id,
    ),
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ROLES_GROUPS_FOR_INVITE_ERROR]: (
    state: any,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE_SUCCESS]: (
    state: any,
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
  [ReduxActionTypes.RESET_USERS_DATA]: (state: any) => ({
    ...state,
    selectedUser: null,
    users: [],
  }),
};
