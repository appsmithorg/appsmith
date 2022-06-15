import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { PermissionGroupListing } from "../acl/PermissionGroupListing";

export const config: AdminConfigType = {
  type: SettingCategories.PERMISSION_GROUP_LISTING,
  controlType: SettingTypes.PAGE,
  component: PermissionGroupListing,
  title: "Permission Groups",
  canSave: false,
} as AdminConfigType;
