export enum PERMISSION_TYPE {
  MANAGE_ORGANIZATION = "manage:organizations",
  CREATE_APPLICATION = "manage:orgApplications",
  MANAGE_APPLICATION = "manage:applications",
  EXPORT_APPLICATION = "export:applications",
  READ_APPLICATION = "read:applications",
  READ_ORGANIZATION = "read:organizations",
  INVITE_USER_TO_ORGANIZATION = "inviteUsers:organization",
  MAKE_PUBLIC_APPLICATION = "makePublic:applications",
  PUBLISH_APPLICATION = "publish:orgApplications",
}

export const isPermitted = (permissions: string[], type: string) => {
  return permissions.includes(type);
};
