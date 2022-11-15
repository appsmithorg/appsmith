export enum PERMISSION_TYPE {
  /* Workspace permissions */
  CREATE_WORKSPACE = "create:workspaces",
  MANAGE_WORKSPACE = "manage:workspaces",
  READ_WORKSPACE = "read:workspaces",
  INVITE_USER_TO_WORKSPACE = "inviteUsers:workspace",
  /* Application permissions */
  CREATE_APPLICATION = "manage:workspaceApplications",
  MANAGE_APPLICATION = "manage:applications",
  EXPORT_APPLICATION = "export:applications",
  READ_APPLICATION = "read:applications",
  MAKE_PUBLIC_APPLICATION = "makePublic:applications",
  PUBLISH_APPLICATION = "publish:workspaceApplications",
  /* Datasource permissions */
  CREATE_DATASOURCES = "create:datasources",
  EXECUTE_DATASOURCES = "execute:datasources",
  CREATE_DATASOURCE_ACTIONS = "create:datasourceActions",
  DELETE_DATASOURCES = "delete:datasources",
  MANAGE_DATASOURCES = "manage:datasources",
  EXECUTE_WORKSPACE_DATASOURCES = "execute:workspaceDatasources",
  /* Page permissions */
  CREATE_PAGES = "create:pages",
  MANAGE_PAGES = "manage:pages",
  DELETE_PAGES = "delete:pages",
  /* Query permissions */
  CREATE_ACTIONS = "create:pageActions",
  MANAGE_ACTIONS = "manage:actions",
  DELETE_ACTIONS = "delete:actions",
  EXECUTE_ACTIONS = "execute:actions",
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
