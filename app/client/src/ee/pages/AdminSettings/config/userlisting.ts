import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { UserListing } from "../acl/UserListing";

export const config: AdminConfigType = {
  type: SettingCategories.USER_LISTING,
  controlType: SettingTypes.PAGE,
  component: UserListing,
  title: "Users",
  canSave: false,
} as AdminConfigType;
