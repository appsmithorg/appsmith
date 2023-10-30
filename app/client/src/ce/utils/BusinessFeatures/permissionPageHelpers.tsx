/* eslint-disable @typescript-eslint/no-restricted-imports */
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateWorkspacePermission as hasCreateWorkspacePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasCreateDatasourcePermission as hasCreateDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateDatasourcePermission as hasCreateDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasManageDatasourcePermission as hasManageDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasManageDatasourcePermission as hasManageDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasDeleteDatasourcePermission as hasDeleteDatasourcePermission_CE } from "ce/utils/permissionHelpers";
import { hasDeleteDatasourcePermission as hasDeleteDatasourcePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasCreateDatasourceActionPermission as hasCreateDatasourceActionPermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateDatasourceActionPermission as hasCreateDatasourceActionPermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasCreatePagePermission as hasCreatePagePermission_CE } from "ce/utils/permissionHelpers";
import { hasCreatePagePermission as hasCreatePagePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasManagePagePermission as hasManagePagePermission_CE } from "ce/utils/permissionHelpers";
import { hasManagePagePermission as hasManagePagePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasDeletePagePermission as hasDeletePagePermission_CE } from "ce/utils/permissionHelpers";
import { hasDeletePagePermission as hasDeletePagePermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasCreateActionPermission as hasCreateActionPermission_CE } from "ce/utils/permissionHelpers";
import { hasCreateActionPermission as hasCreateActionPermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasManageActionPermission as hasManageActionPermission_CE } from "ce/utils/permissionHelpers";
import { hasManageActionPermission as hasManageActionPermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasDeleteActionPermission as hasDeleteActionPermission_CE } from "ce/utils/permissionHelpers";
import { hasDeleteActionPermission as hasDeleteActionPermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasExecuteActionPermission as hasExecuteActionPermission_CE } from "ce/utils/permissionHelpers";
import { hasExecuteActionPermission as hasExecuteActionPermission_EE } from "@appsmith/utils/permissionHelpers";

import { hasAuditLogsReadPermission as hasAuditLogsReadPermission_CE } from "ce/utils/permissionHelpers";
import { hasAuditLogsReadPermission as hasAuditLogsReadPermission_EE } from "@appsmith/utils/permissionHelpers";

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

export const getHasCreateDatasourceActionPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreateDatasourceActionPermission_EE(permissions);
  else return hasCreateDatasourceActionPermission_CE(permissions);
};

export const getHasCreatePagePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreatePagePermission_EE(permissions);
  else return hasCreatePagePermission_CE(permissions);
};

export const getHasManagePagePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasManagePagePermission_EE(permissions);
  else return hasManagePagePermission_CE(permissions);
};

export const getHasDeletePagePermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasDeletePagePermission_EE(permissions);
  else return hasDeletePagePermission_CE(permissions);
};

export const getHasCreateActionPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasCreateActionPermission_EE(permissions);
  else return hasCreateActionPermission_CE(permissions);
};

export const getHasManageActionPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasManageActionPermission_EE(permissions);
  else return hasManageActionPermission_CE(permissions);
};

export const getHasDeleteActionPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasDeleteActionPermission_EE(permissions);
  else return hasDeleteActionPermission_CE(permissions);
};

export const getHasExecuteActionPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasExecuteActionPermission_EE(permissions);
  else return hasExecuteActionPermission_CE(permissions);
};

export const getHasAuditLogsReadPermission = (
  isEnabled: boolean,
  permissions?: string[],
) => {
  if (isEnabled) return hasAuditLogsReadPermission_EE(permissions);
  else return hasAuditLogsReadPermission_CE(permissions);
};

export const hasCreateDSActionPermissionInApp = (
  isEnabled: boolean,
  dsPermissions?: string[],
  pagePermissions?: string[],
) => {
  return (
    getHasCreateDatasourceActionPermission(isEnabled, dsPermissions) &&
    getHasCreateActionPermission(isEnabled, pagePermissions)
  );
};
