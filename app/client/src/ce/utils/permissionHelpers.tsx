/* eslint-disable @typescript-eslint/no-unused-vars */
export enum PERMISSION_TYPE {
  /* Workspace permissions */
  CREATE_WORKSPACE = "createWorkspaces:tenant",
  MANAGE_WORKSPACE = "manage:workspaces",
  READ_WORKSPACE = "read:workspaces",
  INVITE_USER_TO_WORKSPACE = "inviteUsers:workspace",
  /* Application permissions */
  MANAGE_WORKSPACE_APPLICATION = "manage:workspaceApplications",
  MANAGE_APPLICATION = "manage:applications",
  EXPORT_APPLICATION = "export:applications",
  DELETE_WORKSPACE_APPLICATIONS = "delete:workspaceApplications",
  READ_WORKSPACE_APPLICATIONS = "read:workspaceApplications",
  EXPORT_WORKSPACE_APPLICATIONS = "export:workspaceApplications",
  READ_APPLICATION = "read:applications",
  MAKE_PUBLIC_APPLICATION = "makePublic:applications",
  MAKE_PUBLIC_WORKSPACE_APPLICATIONS = "makePublic:workspaceApplications",
  PUBLISH_APPLICATION = "publish:workspaceApplications",
  CREATE_APPLICATION = "create:applications",
  /* Datasource permissions */
  CREATE_DATASOURCES = "create:datasources",
  EXECUTE_DATASOURCES = "execute:datasources",
  CREATE_DATASOURCE_ACTIONS = "create:datasourceActions",
  DELETE_DATASOURCES = "delete:datasources",
  MANAGE_DATASOURCES = "manage:datasources",
  EXECUTE_WORKSPACE_DATASOURCES = "execute:workspaceDatasources",
  MANAGE_WORKSPACE_DATASOURCES = "manage:workspaceDatasources",
  READ_WORKSPACE_DATASOURCES = "read:workspaceDatasources",
  /* Page permissions */
  CREATE_PAGES = "create:pages",
  MANAGE_PAGES = "manage:pages",
  DELETE_PAGES = "delete:pages",
  /* Query permissions */
  CREATE_ACTIONS = "create:pageActions",
  MANAGE_ACTIONS = "manage:actions",
  DELETE_ACTIONS = "delete:actions",
  EXECUTE_ACTIONS = "execute:actions",
  /* Git permissions */
  CONNECT_TO_GIT = "connectToGit:applications",
  MANAGE_PROTECTED_BRANCHES = "manageProtectedBranches:applications",
  MANAGE_DEFAULT_BRANCH = "manageDefaultBranches:applications",
  MANAGE_AUTO_COMMIT = "manageAutoCommit:applications",
}

export enum LOGIC_FILTER {
  AND = "AND",
  OR = "OR",
}

export const isPermitted = (
  permissions: string[] = [],
  type: string | string[],
  filter: LOGIC_FILTER = LOGIC_FILTER.AND,
) => {
  if (Array.isArray(type)) {
    if (filter === LOGIC_FILTER.AND) {
      return type.every((t) => permissions.includes(t));
    } else {
      return type.some((t) => permissions.includes(t));
    }
  }

  return permissions.includes(type);
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

export const hasInviteUserToApplicationPermission = (
  permissions: string[] = [],
) => {
  return isPermitted(permissions, PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE);
};

export const hasCreateWorkspacePermission = (_permissions?: string[]) => true;

export const hasCreateDatasourcePermission = (_permissions?: string[]) => true;

export const hasManageDatasourcePermission = (_permissions?: string[]) => true;

export const hasManageWorkspaceDatasourcePermission = (
  _permissions?: string[],
) => true;

export const hasDeleteDatasourcePermission = (_permissions?: string[]) => true;

export const hasCreateDatasourceActionPermission = (_permissions?: string[]) =>
  true;

export const hasCreatePagePermission = (_permissions?: string[]) => true;

export const hasManagePagePermission = (_permissions?: string[]) => true;

export const hasDeletePagePermission = (_permissions?: string[]) => true;

export const hasCreateActionPermission = (_permissions?: string[]) => true;

export const hasManageActionPermission = (_permissions?: string[]) => true;

export const hasDeleteActionPermission = (_permissions?: string[]) => true;

export const hasExecuteActionPermission = (_permissions?: string[]) => true;

export const hasAuditLogsReadPermission = (_permissions?: string[]) => true;

export const hasManageWorkspaceEnvironmentPermission = (
  _permissions?: string[],
) => false;

export const hasConnectToGitPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.CONNECT_TO_GIT);
};

export const hasManageProtectedBranchesPermission = (
  permissions: string[] = [],
) => {
  return isPermitted(permissions, PERMISSION_TYPE.MANAGE_PROTECTED_BRANCHES);
};

export const hasManageDefaultBranchPermission = (
  permissions: string[] = [],
) => {
  return isPermitted(permissions, PERMISSION_TYPE.MANAGE_DEFAULT_BRANCH);
};

export const hasManageAutoCommitPermission = (permissions: string[] = []) => {
  return isPermitted(permissions, PERMISSION_TYPE.MANAGE_AUTO_COMMIT);
};
