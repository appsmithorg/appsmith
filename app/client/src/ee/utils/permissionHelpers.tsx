export * from "ce/utils/permissionHelpers";
import {
  isPermitted,
  PERMISSION_TYPE as CE_PERMISSION_TYPE,
} from "ce/utils/permissionHelpers";

enum EE_PERMISSION_TYPE {
  /* Tenant Permissions */
  CREATE_USERGROUPS = "createUserGroups:tenant",
  CREATE_PERMISSIONGROUPS = "createPermissionGroups:tenant",
  /* User Permissions */
  MANAGE_USERS = "manage:users",
  DELETE_USERS = "delete:users",
  /* User group permissions i.e Groups */
  DELETE_USERGROUPS = "delete:userGroups",
  MANAGE_USERGROUPS = "manage:userGroups",
  READ_USERGROUPS = "read:userGroups",
  ADD_USERS_TO_USERGROUPS = "addUsers:userGroups",
  REMOVE_USERS_FROM_USERGROUPS = "removeUsers:userGroups",
  /* Permission group permissions i.e Roles */
  ASSIGN_PERMISSIONGROUPS = "assign:permissionGroups",
  DELETE_PERMISSIONGROUPS = "delete:permissionGroups",
  MANAGE_PERMISSIONGROUPS = "manage:permissionGroups",
  READ_PERMISSIONGROUPS = "read:permissionGroups",
  UNASSIGN_PERMISSIONGROUPS = "unassign:permissionGroups",
  /* Audit Logs */
  READ_AUDIT_LOGS = "read:auditLogs",
}

export const PERMISSION_TYPE = {
  ...CE_PERMISSION_TYPE,
  ...EE_PERMISSION_TYPE,
};

export const hasDeleteApplicationPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.MANAGE_APPLICATION);
};

export const hasCreateNewAppPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.CREATE_APPLICATION);
};

export const hasDeleteWorkspacePermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.MANAGE_WORKSPACE);
};
