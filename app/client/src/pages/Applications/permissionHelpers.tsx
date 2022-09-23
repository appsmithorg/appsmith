export enum PERMISSION_TYPE {
  MANAGE_WORKSPACE = "manage:workspaces",
  CREATE_APPLICATION = "manage:workspaceApplications",
  MANAGE_APPLICATION = "manage:applications",
  EXPORT_APPLICATION = "export:applications",
  READ_APPLICATION = "read:applications",
  READ_WORKSPACE = "read:workspaces",
  INVITE_USER_TO_WORKSPACE = "inviteUsers:workspace",
  MAKE_PUBLIC_APPLICATION = "makePublic:applications",
  PUBLISH_APPLICATION = "publish:workspaceApplications",
  CREATE_DATASOURCE = "create:datasources",
  CREATE_DATASOURCE_ACTIONS = "create:datasourceActions",
  DELETE_DATASOURCE = "delete:datasources",
  MANAGE_DATASOURCE = "manage:datasources",
  CREATE_PAGE = "create:pages",
  MANAGE_PAGE = "manage:pages",
  DELETE_PAGE = "delete:pages",
  CREATE_ACTION = "create:pageActions",
  MANAGE_ACTION = "manage:actions",
  DELETE_ACTION = "delete:actions",
  EXECUTE_ACTION = "execute:actions",
  MANAGE_ACTIONS = "manage:actions",
  MANAGE_PAGES = "manage:pages",
  CREATE_WORKSPACES = "create:workspaces",
}

export enum LOGIC_FILTER {
  AND = "AND",
  OR = "OR",
}

export const isPermitted = (
  permissions: string[],
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
