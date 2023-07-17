import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { ProvisioningUpgradePage } from "../../Upgrade/ProvisioningUpgradePage";

export const config: AdminConfigType = {
  icon: "user-follow-line",
  type: SettingCategories.PROVISIONING,
  categoryType: "acl",
  controlType: SettingTypes.PAGE,
  component: ProvisioningUpgradePage,
  title: "Provisioning",
  canSave: false,
  needsUpgrade: true,
  isEnterprise: true,
} as AdminConfigType;
