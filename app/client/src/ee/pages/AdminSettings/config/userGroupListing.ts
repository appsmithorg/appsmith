import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { UserGroupListing } from "../acl/UserGroupListing";

export const config: AdminConfigType = {
  type: SettingCategories.USER_GROUP_LISTING,
  controlType: SettingTypes.PAGE,
  component: UserGroupListing,
  title: "User Groups",
  canSave: false,
} as AdminConfigType;
