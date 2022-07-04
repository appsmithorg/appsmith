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
}

export const isPermitted = (permissions: string[], type: string) => {
  return permissions.includes(type);
};
