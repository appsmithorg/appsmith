export * from "ce/pages/AdminSettings/config/types";
import {
  AdminConfigType as CE_AdminConfigType,
  Category as CE_Category,
  Setting as CE_Setting,
  SettingCategories as CE_SettingCategories,
  SettingSubCategories as CE_SettingSubCategories,
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
  BILLING: "billing",
};
const EE_SettingSubCategories = {
  SAML: "saml signup",
  OIDC: "oidc signup",
};

export const SettingCategories = {
  ...CE_SettingCategories,
  ...EE_SettingCategories,
};
export const SettingSubCategories = {
  ...CE_SettingSubCategories,
  ...EE_SettingSubCategories,
};
export type AdminConfigType = CE_AdminConfigType;
export type Category = CE_Category;
export type Setting = CE_Setting;
export { SettingSubtype, SettingTypes };
