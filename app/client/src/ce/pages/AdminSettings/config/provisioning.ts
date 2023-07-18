import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { ProvisioningUpgradePage } from "../../Upgrade/ProvisioningUpgradePage";

export const config: AdminConfigType = {
  icon: "user-follow-line",
  type: SettingCategories.PROVISIONING,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  component: ProvisioningUpgradePage,
  title: "Provisioning",
  canSave: false,
  needsUpgrade: true,
  isEnterprise: true,
} as AdminConfigType;
