import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { AccessControlUpgradePage } from "../../Upgrade/AccessControlUpgradePage";

export const config: AdminConfigType = {
  icon: "user-3-line",
  type: SettingCategories.ACCESS_CONTROL,
  categoryType: CategoryType.USER_MANAGEMENT,
  controlType: SettingTypes.PAGE,
  component: AccessControlUpgradePage,
  title: "Access Control",
  canSave: false,
  isFeatureEnabled: false,
} as AdminConfigType;
