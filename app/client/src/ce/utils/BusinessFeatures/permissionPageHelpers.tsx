// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_EE } from "@appsmith/utils/permissionHelpers";

export const getHasCreateWorkspacePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreateWorkspacePermission_EE(permissions);
  else return hasCreateWorkspacePermission_CE(permissions);
};
