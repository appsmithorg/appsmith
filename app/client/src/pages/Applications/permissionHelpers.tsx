export enum PERMISSION_TYPE {
  CREATE_APPLICATION = "manage:orgApplications",
  MANAGE_APPLICATION = "manage:applications",
  READ_APPLICATION = "read:applications",
  READ_ORGANIZATION = "read:organizations",
}

export const isPermitted = (permissions: string[], type: string) => {
  return permissions.includes(type);
};
