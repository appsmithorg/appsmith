import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { GroupListing } from "../AccessControl/GroupsListing";

export const config: AdminConfigType = {
  icon: "user-2-line",
  type: SettingCategories.GROUPS_LISTING,
  controlType: SettingTypes.PAGE,
  component: GroupListing,
  title: "Groups",
  canSave: false,
} as AdminConfigType;
