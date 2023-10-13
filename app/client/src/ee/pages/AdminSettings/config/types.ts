export * from "ce/pages/AdminSettings/config/types";
import type {
  AdminConfigType as CE_AdminConfigType,
  Category as CE_Category,
  Setting as CE_Setting,
} from "ce/pages/AdminSettings/config/types";
import {
  SettingCategories as CE_SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "ce/pages/AdminSettings/config/types";

const EE_SettingCategories = {
  SAML_AUTH: "saml-auth",
  OIDC_AUTH: "oidc-auth",
  USER_LISTING: "users",
  GROUPS_LISTING: "groups",
  ROLES_LISTING: "roles",
  AUDIT_LOGS: "audit-logs",
  AUDIT_LOGS_SETTINGS: "audit-logs-settings",
  BILLING: "license",
  PROVISIONING: "provisioning",
  SCIM_PROVISIONING: "scim",
};

export const SettingCategories = {
  ...CE_SettingCategories,
  ...EE_SettingCategories,
};

export type AdminConfigType = CE_AdminConfigType;
export type Category = CE_Category;
export type Setting = CE_Setting;
export { SettingSubtype, SettingTypes };
