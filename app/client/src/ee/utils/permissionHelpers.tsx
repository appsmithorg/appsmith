export * from "ce/utils/permissionHelpers";
import {
  isPermitted,
  PERMISSION_TYPE as CE_PERMISSION_TYPE,
} from "ce/utils/permissionHelpers";

export const PERMISSION_TYPE = {
  ...CE_PERMISSION_TYPE,
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
