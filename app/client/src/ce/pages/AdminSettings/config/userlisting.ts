import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { AccessControlUpgradePage } from "../../Upgrade/AccessControlUpgradePage";

export const config: AdminConfigType = {
  icon: "user-3-line",
  type: SettingCategories.ACCESS_CONTROL,
  categoryType: "acl",
  controlType: SettingTypes.PAGE,
  component: AccessControlUpgradePage,
  title: "Access Control",
  canSave: false,
  needsUpgrade: true,
} as AdminConfigType;
