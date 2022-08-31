import { AppState } from "@appsmith/reducers";

export const getAllAclUsers = (state: AppState) => state.acl.users;
export const getGroups = (state: AppState) => state.acl.groups;
export const getRoles = (state: AppState) => state.acl.roles;
export const getSelectedUser = (state: AppState) => state.acl.selectedUser;
export const getSelectedGroup = (state: AppState) => state.acl.selectedGroup;
export const getSelectedRole = (state: AppState) => state.acl.selectedRole;
export const getIsLoading = (state: AppState) => state.acl.isLoading;
