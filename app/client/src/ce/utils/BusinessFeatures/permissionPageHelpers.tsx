/* eslint-disable @typescript-eslint/no-restricted-imports */
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasCreateDatasourcePermission as hasCreateDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateDatasourcePermission as hasCreateDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasManageDatasourcePermission as hasManageDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasManageDatasourcePermission as hasManageDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasDeleteDatasourcePermission as hasDeleteDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasDeleteDatasourcePermission as hasDeleteDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

export const getHasCreateWorkspacePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreateWorkspacePermission_EE(permissions);
  else return hasCreateWorkspacePermission_CE(permissions);
};

export const getHasCreateDatasourcePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreateDatasourcePermission_EE(permissions);
  else return hasCreateDatasourcePermission_CE(permissions);
};

export const getHasManageDatasourcePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasManageDatasourcePermission_EE(permissions);
  else return hasManageDatasourcePermission_CE(permissions);
};

export const getHasDeleteDatasourcePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasDeleteDatasourcePermission_EE(permissions);
  else return hasDeleteDatasourcePermission_CE(permissions);
};
