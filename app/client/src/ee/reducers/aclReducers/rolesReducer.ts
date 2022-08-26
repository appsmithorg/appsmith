import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const rolesReducers = {
  [ReduxActionTypes.FETCH_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_BY_ID]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedRole: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.CLONE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_ROLE]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.DELETE_ACL_ROLE_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_ROLE_SUCCESS]: (state: any, action: any) => ({
    ...state,
    roles: action.payload,
    isLoading: false,
  }),
};
