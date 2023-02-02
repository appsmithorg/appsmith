import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { RoleProps } from "@appsmith/pages/AdminSettings/AccessControl/types";

export const rolesReducers = {
  [ReduxActionTypes.FETCH_ACL_ROLES]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_ROLES_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLES_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
    ...(state.selectedRole
      ? {
          selectedRole: {
            ...state.selectedRole,
            isNew: false,
          },
        }
      : {}),
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_BY_ID]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.FETCH_ACL_ROLE_BY_ID_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedRole: {
      ...action.payload,
      isSaving: false,
      isNew: false,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CREATE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CREATE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    selectedRole: {
      ...action.payload,
      isSaving: false,
      isNew: true,
    },
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.CLONE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE_NAME]: (state: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      isSaving: true,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_ACL_ROLE_NAME_ERROR]: (state: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      isSaving: false,
      isNew: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE_NAME_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      name: action.payload.name,
      description: action.payload.description,
      isSaving: false,
      isNew: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE]: (state: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      isSaving: true,
      isNew: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      isSaving: false,
      isNew: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      tabs: action.payload.tabs,
      userPermissions:
        action.payload.userPermissions ?? state.selectedRole.userPermissions,
      isSaving: false,
      isNew: false,
    },
  }),
  [ReduxActionTypes.DELETE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionErrorTypes.DELETE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: state.roles.filter(
      (role: RoleProps) => role.id !== action.payload.id,
    ),
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ICON_LOCATIONS]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ICON_LOCATIONS_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    iconLocations: action.payload,
    isLoading: false,
  }),
  [ReduxActionErrorTypes.FETCH_ICON_LOCATIONS_ERROR]: (state: any) => ({
    ...state,
    iconLocations: [],
    isLoading: false,
  }),
  [ReduxActionTypes.RESET_ROLES_DATA]: (state: any) => ({
    ...state,
    selectedRole: null,
    roles: [],
  }),
  [ReduxActionTypes.IS_SAVING_ROLE]: (state: any, action: any) => ({
    ...state,
    selectedRole: {
      ...state.selectedRole,
      isSaving: action.payload,
      isNew: false,
    },
  }),
};
