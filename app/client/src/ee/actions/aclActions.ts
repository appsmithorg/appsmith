import { FetchSingleDataPayload } from "@appsmith/api/AclApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  BaseAclProps,
  GroupProps,
  RoleProps,
} from "@appsmith/pages/AdminSettings/acl/types";

export const getUserById = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_USER_BY_ID,
  payload,
});

export const deleteAclUser = (id: string) => ({
  type: ReduxActionTypes.DELETE_ACL_USER,
  payload: id,
});

export const getGroupById = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID,
  payload,
});

export const updateGroupName = (payload: BaseAclProps) => ({
  type: ReduxActionTypes.UPDATE_ACL_GROUP_NAME,
  payload,
});

export const deleteGroup = (id: string) => ({
  type: ReduxActionTypes.DELETE_ACL_GROUP,
  payload: id,
});

export const cloneGroup = (payload: GroupProps) => ({
  type: ReduxActionTypes.CLONE_ACL_GROUP,
  payload,
});

export const createGroup = (payload: { name: string }) => ({
  type: ReduxActionTypes.CREATE_ACL_GROUP,
  payload,
});

export const getRoleById = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID,
  payload,
});

export const updateRoleName = (payload: BaseAclProps) => ({
  type: ReduxActionTypes.UPDATE_ACL_ROLE_NAME,
  payload,
});

export const deleteRole = (id: string) => ({
  type: ReduxActionTypes.DELETE_ACL_ROLE,
  payload: id,
});

export const cloneRole = (payload: RoleProps) => ({
  type: ReduxActionTypes.CLONE_ACL_ROLE,
  payload,
});

export const createRole = (payload: { name: string }) => ({
  type: ReduxActionTypes.CREATE_ACL_ROLE,
  payload,
});

export const addUsersInGroup = (usernames: string[], groupId: string) => ({
  type: ReduxActionTypes.ADD_USERS_IN_GROUP,
  payload: {
    usernames,
    groupIds: [groupId],
  },
});

export const removeUsersFromGroup = (usernames: string[], groupId: string) => ({
  type: ReduxActionTypes.REMOVE_USERS_FROM_GROUP,
  payload: {
    usernames,
    groupIds: [groupId],
  },
});
