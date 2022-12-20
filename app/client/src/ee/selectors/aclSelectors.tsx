import { AppState } from "@appsmith/reducers";

export const getAllAclUsers = (state: AppState) => state.acl.users;
export const getGroups = (state: AppState) => state.acl.groups;
export const getRoles = (state: AppState) => state.acl.roles;
export const getSelectedUser = (state: AppState) => state.acl.selectedUser;
export const getSelectedGroup = (state: AppState) => state.acl.selectedGroup;
export const getSelectedRole = (state: AppState) => state.acl.selectedRole;
export const getAclIsLoading = (state: AppState) => state.acl.isLoading;
export const getRolesForInvite = (state: AppState) =>
  state.acl.inviteOptions.roles;
export const getGroupsForInvite = (state: AppState) =>
  state.acl.inviteOptions.groups;
export const getAclIsSaving = (state: AppState) => state.acl.isSaving;
export const getIconLocations = (state: AppState) => state.acl.iconLocations;
