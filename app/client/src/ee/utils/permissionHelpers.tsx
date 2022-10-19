export * from "ce/utils/permissionHelpers";
import { PERMISSION_TYPE as CE_PERMISSION_TYPE } from "ce/utils/permissionHelpers";

export const PERMISSION_TYPE = {
  ...CE_PERMISSION_TYPE,
};

export type PERMISSION_TYPE = typeof PERMISSION_TYPE[keyof typeof PERMISSION_TYPE];
