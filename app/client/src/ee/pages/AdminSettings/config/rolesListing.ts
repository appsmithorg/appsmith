import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { RolesListing } from "../AccessControl/RolesListing";

export const config: AdminConfigType = {
  icon: "key-2-line",
  type: SettingCategories.ROLES_LISTING,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  component: RolesListing,
  title: "Roles",
  canSave: false,
} as AdminConfigType;
