import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import RolesListing from "../acl/RolesListing";

export const config: AdminConfigType = {
  type: SettingCategories.ROLES_LISTING,
  controlType: SettingTypes.PAGE,
  component: RolesListing,
  title: "Roles",
  canSave: false,
} as AdminConfigType;
