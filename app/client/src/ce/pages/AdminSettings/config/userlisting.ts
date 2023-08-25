import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { AccessControlUpgradePage } from "../../Upgrade/AccessControlUpgradePage";

export const config: AdminConfigType = {
  icon: "user-3-line",
  type: SettingCategories.ACCESS_CONTROL,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  component: AccessControlUpgradePage,
  title: "Access Control",
  canSave: false,
  isFeatureEnabled: false,
} as AdminConfigType;
