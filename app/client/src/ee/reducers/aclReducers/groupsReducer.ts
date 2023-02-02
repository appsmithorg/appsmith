import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { GroupProps } from "@appsmith/pages/AdminSettings/AccessControl/types";

export const groupsReducers = {
  [ReduxActionTypes.FETCH_ACL_GROUPS]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_GROUPS_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUPS_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
    ...(state.selectedGroup
      ? {
          selectedGroup: {
            ...state.selectedGroup,
            isNew: false,
          },
        }
      : {}),
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_BY_ID]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_GROUP_BY_ID_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedGroup: {
      ...action.payload,
      isNew: false,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CREATE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    selectedGroup: {
      ...action.payload,
      isNew: true,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CLONE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_NAME]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.UPDATE_ACL_GROUP_NAME_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_NAME_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedGroup: {
      ...state.selectedGroup,
      name: action.payload.name,
      description: action.payload.description,
      isNew: false,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_ROLES]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_ROLES_SUCCESS]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_ACL_GROUP_ROLES_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.DELETE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: state.groups.filter(
      (group: GroupProps) => group.id !== action.payload.id,
    ),
    isLoading: false,
  }),
  [ReduxActionTypes.ADD_USERS_IN_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.ADD_USERS_IN_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.ADD_USERS_IN_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    selectedGroup: {
      ...state.selectedGroup,
      users: Array.isArray(action.payload)
        ? action.payload[0].users
        : action.payload.users,
      isNew: false,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.REMOVE_USERS_FROM_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.REMOVE_USERS_FROM_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.REMOVE_USERS_FROM_GROUP_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedGroup: {
      ...state.selectedGroup,
      users: Array.isArray(action.payload)
        ? action.payload[0].users
        : action.payload.users,
      isNew: false,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.RESET_GROUPS_DATA]: (state: any) => ({
    ...state,
    selectedGroup: null,
    groups: [],
  }),
};
