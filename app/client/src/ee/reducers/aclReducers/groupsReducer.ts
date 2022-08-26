import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const groupsReducers = {
  [ReduxActionTypes.FETCH_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_BY_ID]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_SUCCESS]: (
    state: any,
    action: any,
  ) => ({
    ...state,
    selectedGroup: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.CLONE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.CLONE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.DELETE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.DELETE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    groups: action.payload,
    isLoading: false,
  }),
};
