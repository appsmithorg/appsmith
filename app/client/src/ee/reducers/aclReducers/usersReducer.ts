import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const userReducers = {
  [ReduxActionTypes.FETCH_ACL_USERS]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_USERS_ERROR]: (state: any) => ({
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
  [ReduxActionTypes.FETCH_ACL_USER_BY_ID_ERROR]: (state: any) => ({
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
  [ReduxActionTypes.UPDATE_ACL_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ACL_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_USER_SUCCESS]: (state: any, action: any) => ({
    ...state,
    users: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.DELETE_ACL_USER_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_USER_SUCCESS]: (state: any, action: any) => ({
    ...state,
    users: action.payload,
    isLoading: false,
  }),
};
