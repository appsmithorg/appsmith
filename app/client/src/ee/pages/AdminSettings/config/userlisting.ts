import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { UserListing } from "../AccessControl/UserListing";

export const config: AdminConfigType = {
  icon: "user-3-line",
  type: SettingCategories.USER_LISTING,
  controlType: SettingTypes.PAGE,
  component: UserListing,
  title: "Users",
  canSave: false,
} as AdminConfigType;
