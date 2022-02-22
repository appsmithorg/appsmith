import {
  SettingCategories as CE_SettingCategories,
  AdminConfigType as CE_AdminConfigType,
  Category as CE_Category,
  Setting as CE_Setting,
  SettingSubtype,
  SettingTypes,
} from "ce/pages/AdminSettings/config/types";

const EE_SettingCategories = {
  OIDC_AUTH: "oidc-auth",
};

export const SettingCategories = {
  ...CE_SettingCategories,
  ...EE_SettingCategories,
};
export type AdminConfigType = CE_AdminConfigType;
export type Category = CE_Category;
export type Setting = CE_Setting;
export { SettingSubtype, SettingTypes };
