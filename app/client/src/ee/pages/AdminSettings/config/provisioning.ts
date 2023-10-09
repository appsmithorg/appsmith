export * from "ce/pages/AdminSettings/config/provisioning";
import { config as CE_config } from "ce/pages/AdminSettings/config/provisioning";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import Provisioning from "../Provisioning";
import { ScimProvisioning } from "../Provisioning/ScimProvisioning";
import { enableEEOnlyFeatures } from "@appsmith/selectors/tenantSelectors";
import store from "store";

const ScimProvisioningConfig: AdminConfigType = {
  type: SettingCategories.SCIM_PROVISIONING,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  title: "SCIM",
  subText: "Configure your identity provider on Appsmith below.",
  canSave: false,
  component: ScimProvisioning,
};

export const config: AdminConfigType = {
  ...CE_config,
  ...(enableEEOnlyFeatures(store.getState())
    ? {
        component: Provisioning,
        title: "Provisioning",
        canSave: false,
        children: [ScimProvisioningConfig],
        isFeatureEnabled: true,
      }
    : {}),
} as AdminConfigType;
