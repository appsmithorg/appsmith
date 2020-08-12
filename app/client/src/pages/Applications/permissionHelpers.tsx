export enum PERMISSION_TYPE {
  MANAGE_ORGANIZATION = "manage:organizations",
  CREATE_APPLICATION = "manage:orgApplications",
  MANAGE_APPLICATION = "manage:applications",
  READ_APPLICATION = "read:applications",
  READ_ORGANIZATION = "read:organizations",
  INVITE_USER_TO_ORGANIZATION = "inviteUsers:organization",
  MAKE_PUBLIC_APPLICATION = "makePublic:applications",
}

export const isPermitted = (permissions: string[], type: string) => {
  return permissions.includes(type);
};
