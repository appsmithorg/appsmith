import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

const allUserGroupsPermissions = [
  PERMISSION_TYPE.ADD_USERS_TO_USERGROUPS,
  PERMISSION_TYPE.DELETE_USERGROUPS,
  PERMISSION_TYPE.MANAGE_USERGROUPS,
  PERMISSION_TYPE.REMOVE_USERS_FROM_USERGROUPS,
  PERMISSION_TYPE.READ_USERGROUPS,
];

const allRolesPermissions = [
  PERMISSION_TYPE.ASSIGN_PERMISSIONGROUPS,
  PERMISSION_TYPE.DELETE_PERMISSIONGROUPS,
  PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS,
  PERMISSION_TYPE.READ_PERMISSIONGROUPS,
  PERMISSION_TYPE.UNASSIGN_PERMISSIONGROUPS,
];

const allTenantPermissions = [
  PERMISSION_TYPE.CREATE_USERGROUPS,
  PERMISSION_TYPE.CREATE_PERMISSIONGROUPS,
  PERMISSION_TYPE.READ_AUDIT_LOGS,
];

const allUserPermissions = [
  PERMISSION_TYPE.MANAGE_USERS,
  PERMISSION_TYPE.DELETE_USERS,
];

export const mockGroupPermissions = (filter: string[] = []) => {
  if (filter.length > 0) {
    const result = allUserGroupsPermissions.filter(
      (permission) => !filter.includes(permission),
    );
    return result;
  }
  return allUserGroupsPermissions;
};

export const mockGetRolePermissions = (filter: string[] = []) => {
  if (filter.length > 0) {
    return allRolesPermissions.filter(
      (permission) => !filter.includes(permission),
    );
  }
  return allRolesPermissions;
};

export const mockTenantPermissions = (filter: string[] = []) => {
  if (filter.length > 0) {
    return allTenantPermissions.filter(
      (permission) => !filter.includes(permission),
    );
  }
  return allTenantPermissions;
};

export const mockUserPermissions = (filter: string[] = []) => {
  if (filter.length > 0) {
    return allUserPermissions.filter(
      (permission) => !filter.includes(permission),
    );
  }
  return allUserPermissions;
};
