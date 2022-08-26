import { FetchSingleUserPayload } from "@appsmith/api/AclApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { RoleProps } from "@appsmith/pages/AdminSettings/acl/RoleAddEdit";
import { UserGroup } from "@appsmith/pages/AdminSettings/acl/GroupsListing";

export const getUserById = (payload: FetchSingleUserPayload) => ({
  type: ReduxActionTypes.FETCH_ACL_USER_BY_ID,
  payload,
});

export const deleteAclUser = (id: string) => ({
  type: ReduxActionTypes.DELETE_ACL_USER,
  payload: id,
});

export const getGroupById = (payload: any) => ({
  type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID,
  payload,
});

export const deleteGroup = (id: string) => ({
  type: ReduxActionTypes.DELETE_ACL_GROUP,
  payload: id,
});

export const cloneGroup = (payload: UserGroup) => ({
  type: ReduxActionTypes.CLONE_ACL_GROUP,
  payload,
});

export const getRoleById = (payload: any) => ({
  type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID,
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
