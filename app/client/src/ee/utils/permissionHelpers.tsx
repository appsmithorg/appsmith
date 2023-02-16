export * from "ce/utils/permissionHelpers";
import {
  isPermitted,
  PERMISSION_TYPE as CE_PERMISSION_TYPE,
} from "ce/utils/permissionHelpers";

export enum EE_PERMISSION_TYPE {
  /* Tenant Permissions */
  CREATE_USERGROUPS = "createUserGroups:tenant",
  CREATE_PERMISSIONGROUPS = "createPermissionGroups:tenant",
  TENANT_MANAGE_ALL_USERS = "tenantManageAllUsers:tenant",
  TENANT_MANAGE_USER_GROUPS = "tenantManageUserGroups:tenant",
  TENANT_READ_USER_GROUPS = "tenantReadUserGroups:tenant",
  TENANT_MANAGE_PERMISSION_GROUPS = "tenantManagePermissionGroups:tenant",
  TENANT_ADD_USERS_TO_GROUPS = "tenantAddUsersToGroups:tenant",
  TENANT_DELETE_PERMISSION_GROUPS = "tenantDeletePermissionGroups:tenant",
  TENANT_REMOVE_USER_FROM_GROUPS = "tenantRemoveUserFromGroups:tenant",
  TENANT_READ_PERMISSION_GROUPS = "tenantReadPermissionGroups:tenant",
  TENANT_ASSIGN_PERMISSION_GROUPS = "tenantAssignPermissionGroups:tenant",
  TENANT_DELETE_USER_GROUPS = "tenantDeleteUserGroups:tenant",
  MANAGE_TENANTS = "manage:tenants",
  TENANT_UNASSIGN_PERMISSION_GROUPS = "tenantUnassignPermissionGroups:tenant",
  /* Application permissions */
  CREATE_APPLICATION = "create:applications",
  DELETE_APPLICATION = "delete:applications",
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
  READ_AUDIT_LOGS = "readAuditLogs:tenant",
  /* Workspace Permissions */
  DELETE_WORKSPACE = "delete:workspace",
}

export const PERMISSION_TYPE = {
  ...CE_PERMISSION_TYPE,
  ...EE_PERMISSION_TYPE,
};

export const hasDeleteApplicationPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.DELETE_APPLICATION);
};

export const hasCreateNewAppPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.CREATE_APPLICATION);
};

export const hasDeleteWorkspacePermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.DELETE_WORKSPACE);
};

export const hasCreateWorkspacePermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.CREATE_WORKSPACE);
};

export const hasCreateDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_DATASOURCES);

export const hasManageDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_DATASOURCES);

export const hasDeleteDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_DATASOURCES);

export const hasCreateDatasourceActionPermission = (
  permissions: string[] = [],
) =>
  isPermitted(permissions, [
    PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS,
    PERMISSION_TYPE.CREATE_ACTIONS,
  ]);

export const hasCreatePagePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_PAGES);

export const hasManagePagePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_PAGES);

export const hasDeletePagePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_PAGES);

export const hasCreateActionPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_ACTIONS);

export const hasManageActionPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_ACTIONS);

export const hasDeleteActionPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_ACTIONS);

export const hasExecuteActionPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.EXECUTE_ACTIONS);
