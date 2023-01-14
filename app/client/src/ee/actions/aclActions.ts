import { FetchSingleDataPayload } from "@appsmith/api/AclApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  BaseAclProps,
  GroupProps,
  RoleProps,
  UpdateRoleData,
} from "@appsmith/pages/AdminSettings/AccessControl/types";

export const getUserById = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_USER_BY_ID,
  payload,
});

export const deleteAclUser = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.DELETE_ACL_USER,
  payload,
});

export const updateGroupsInUser = (
  userId: string,
  user: string,
  groupsAdded: BaseAclProps[],
  groupsRemoved: BaseAclProps[],
) => ({
  type: ReduxActionTypes.UPDATE_GROUPS_IN_USER,
  payload: {
    userId,
    usernames: [user],
    groupsAdded,
    groupsRemoved,
  },
});

export const updateRolesInUser = (
  user: { id: string; username: string },
  rolesAdded: BaseAclProps[],
  rolesRemoved: BaseAclProps[],
) => ({
  type: ReduxActionTypes.UPDATE_ROLES_IN_USER,
  payload: {
    users: [user],
    rolesAdded,
    rolesRemoved,
  },
});

export const getGroupById = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID,
  payload,
});

export const updateGroupName = (payload: {
  id: string;
  name: string;
  description?: string;
}) => ({
  type: ReduxActionTypes.UPDATE_ACL_GROUP_NAME,
  payload,
});

export const deleteGroup = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.DELETE_ACL_GROUP,
  payload,
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

export const updateRoleName = (payload: {
  id: string;
  name: string;
  description?: string;
}) => ({
  type: ReduxActionTypes.UPDATE_ACL_ROLE_NAME,
  payload,
});

export const deleteRole = (payload: FetchSingleDataPayload) => ({
  type: ReduxActionTypes.DELETE_ACL_ROLE,
  payload,
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
    groupIds: groupId.split(","),
  },
});

export const removeUsersFromGroup = (usernames: string[], groupId: string) => ({
  type: ReduxActionTypes.REMOVE_USERS_FROM_GROUP,
  payload: {
    usernames,
    groupIds: groupId.split(","),
  },
});

export const updateRolesInGroup = (
  groups: BaseAclProps,
  rolesAdded: BaseAclProps[],
  rolesRemoved: BaseAclProps[],
) => ({
  type: ReduxActionTypes.UPDATE_ACL_GROUP_ROLES,
  payload: {
    groups: [groups],
    rolesAdded,
    rolesRemoved,
  },
});

export const updateRoleById = (
  tabName: string,
  entitiesChanged: UpdateRoleData[],
  roleId: string,
) => ({
  type: ReduxActionTypes.UPDATE_ACL_ROLE,
  payload: {
    tabName,
    entitiesChanged,
    roleId,
  },
});

export const inviteUsersViaGroups = (
  usernames: string[],
  groupIds: string[],
  via: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_ACL_USER,
    payload: {
      usernames,
      groupIds,
      via,
    },
  };
};

export const inviteUsersViaRoles = (
  users: { username: string }[],
  rolesAdded: string[],
  via: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_ACL_USER,
    payload: {
      users,
      rolesAdded,
      via,
    },
  };
};
