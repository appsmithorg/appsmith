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
import {
  isAirgapLicense,
  isEnterprise,
} from "@appsmith/selectors/tenantSelectors";
import store from "store";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

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
  ...(isEnterprise(store.getState()) ||
  (isAirgapped() && isAirgapLicense(store.getState()))
    ? {
        component: Provisioning,
        title: "Provisioning",
        canSave: false,
        children: [ScimProvisioningConfig],
        isFeatureEnabled: true,
      }
    : {}),
} as AdminConfigType;
