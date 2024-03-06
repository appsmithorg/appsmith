import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { GroupListing } from "../AccessControl/GroupsListing";

export const config: AdminConfigType = {
  icon: "user-2-line",
  type: SettingCategories.GROUPS_LISTING,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  component: GroupListing,
  title: "Groups",
  canSave: false,
} as AdminConfigType;
