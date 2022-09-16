import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GroupProps } from "@appsmith/pages/AdminSettings/acl/types";

export const groupsReducers = {
  [ReduxActionTypes.FETCH_ACL_GROUPS]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUPS_ERROR]: (state: any) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_ACL_GROUPS_SUCCESS]: (state: any, action: any) => ({
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
  [ReduxActionTypes.ACL_GROUP_IS_SAVING]: (state: any, action: any) => ({
    ...state,
    isSaving: action.payload.isSaving,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP]: (state: any) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_ERROR]: (state: any) => ({
    ...state,
    isSaving: false,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ACL_GROUP_SUCCESS]: (state: any, action: any) => ({
    ...state,
    selectedGroup: action.payload,
    isSaving: false,
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
    groups: state.groups.filter(
      (group: GroupProps) => group.id !== action.payload.id,
    ),
    isLoading: false,
  }),
};
