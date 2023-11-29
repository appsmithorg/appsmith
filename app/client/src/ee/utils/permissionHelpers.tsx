/* eslint-disable @typescript-eslint/no-unused-vars */
export * from "ce/utils/permissionHelpers";
import {
  isPermitted,
  PERMISSION_TYPE as CE_PERMISSION_TYPE,
  LOGIC_FILTER,
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
  INVITE_USER_TO_APPLICATION = "inviteUsers:applications",
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
  /* Environment permissions */
  EXECUTE_ENVIRONMENT = "execute:environments",
  MANAGE_WORKSPACE_ENVIRONMENT = "manage:workspaceEnvironments",
  DELETE_WORKSPACE_ENVIRONMENT = "delete:workspaceEnvironments",
  VIEW_WORKSPACE_ENVIRONMENT = "read:workspaceEnvironments",
  CREATE_ENVIRONMENT = "create:environments",
  DELETE_ENVIRONMENT = "delete:environments",
  MANAGE_ENVIRONMENT = "manage:environments",
  /** Package permissions */
  MANAGE_WORKSPACE_PACKAGES = "manage:workspacePackages",
  CREATE_PACKAGE = "create:packages",
  MANAGE_PACKAGES = "manage:packages",
  DELETE_PACKAGE = "delete:packages",
  /** Module permissions */
  CREATE_MODULES = "create:modules",
  MANAGE_MODULES = "manage:modules",
  DELETE_MODULES = "delete:modules",
  CREATE_MODULES_ACTIONS = "create:moduleActions",
  /** Module instance permissions */
  DELETE_MODULE_INSTANCES = "delete:moduleInstances",
  MANAGE_MODULE_INSTANCES = "manage:moduleInstances",
  EXECUTE_MODULE_INSTANCES = "execute:moduleInstances",
  /** Workflow permissions */
  MANAGE_WORKSPACE_WORKFLOWS = "manage:workspaceWorkflows",
  READ_WORKSPACE_WORKFLOWS = "read:workspaceWorkflows",
  DELETE_WORKSPACE_WORKFLOWS = "delete:workspaceWorkflows",
  PUBLISH_WORKSPACE_WORKFLOWS = "publish:workspaceWorkflows",
  EXPORT_WORKSPACE_WORKFLOW = "export:workspaceWorkflows",
  EXECUTE_WORKSPACE_WORKFLOW = "execute:workflows",
  EXPORT_WORKFLOWS = "export:workflows",
  CREATE_WORKFLOWS = "create:workflows",
  DELETE_WORKFLOWS = "delete:workflows",
  MANAGE_WORKFLOWS = "manage:workflows",
  READ_WORKFLOWS = "read:workflows",
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

export const hasInviteUserToApplicationPermission = (
  permissions: string[] = [],
) => {
  return isPermitted(permissions, PERMISSION_TYPE.INVITE_USER_TO_APPLICATION);
};

export const hasCreateWorkspacePermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.CREATE_WORKSPACE);
};

export const hasCreateDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_DATASOURCES);

export const hasManageDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_DATASOURCES);

export const hasManageWorkspaceDatasourcePermission = (
  permissions: string[] = [],
) => isPermitted(permissions, PERMISSION_TYPE.MANAGE_WORKSPACE_DATASOURCES);

export const hasDeleteDatasourcePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_DATASOURCES);

export const hasCreateDatasourceActionPermission = (
  permissions: string[] = [],
) => isPermitted(permissions, PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS);

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

export const hasAuditLogsReadPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.READ_AUDIT_LOGS);

// Package permissions start
export const hasManageWorkspacePackagePermission = (
  permissions: string[] = [],
) => isPermitted(permissions, PERMISSION_TYPE.MANAGE_WORKSPACE_PACKAGES);

export const hasCreatePackagePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_PACKAGE);

export const hasDeletePackagePermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_PACKAGE);

// Package permissions end

// Workflow permissions start

export const hasManageWorkspaceWorkflowPermission = (
  permissions: string[] = [],
) => isPermitted(permissions, PERMISSION_TYPE.MANAGE_WORKSPACE_WORKFLOWS);

export const hasCreateWorkflowPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_WORKFLOWS);

export const hasDeleteWorkflowPermission = (permissions: string[] = []) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_WORKFLOWS);
// Workflow permissions end

// Module permissions start
export const hasCreateModulePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_MODULES);

export const hasManageModulePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_MODULES);

export const hasDeleteModulePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_MODULES);

export const hasCreateModuleActionsPermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_MODULES_ACTIONS);

export const hasExecuteModuleInstancePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.EXECUTE_MODULE_INSTANCES);

export const hasCreateModuleDatasourceActionPermission = (
  permissions: string[] = [],
) => isPermitted(permissions, [PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS]);

// Module permissions end

// Environment permissions start
export const hasManageWorkspaceEnvironmentPermission = (
  permissions?: string[],
) =>
  isPermitted(
    permissions,
    [
      PERMISSION_TYPE.MANAGE_WORKSPACE_ENVIRONMENT,
      PERMISSION_TYPE.CREATE_ENVIRONMENT,
      PERMISSION_TYPE.DELETE_WORKSPACE_ENVIRONMENT,
      PERMISSION_TYPE.VIEW_WORKSPACE_ENVIRONMENT,
    ],
    LOGIC_FILTER.OR,
  );

export const hasManageEnvironmentPermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_ENVIRONMENT);

export const hasCreateEnvironmentPermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.CREATE_ENVIRONMENT);

export const hasDeleteEnvironmentPermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_ENVIRONMENT);
// Environment permissions end

export const hasDeleteModuleInstancePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.DELETE_MODULE_INSTANCES);

export const hasManageModuleInstancePermission = (permissions?: string[]) =>
  isPermitted(permissions, PERMISSION_TYPE.MANAGE_MODULE_INSTANCES);
