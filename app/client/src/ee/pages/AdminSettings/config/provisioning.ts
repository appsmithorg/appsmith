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
import store from "store";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isSCIMEnabled } from "@appsmith/utils/planHelpers";

const ScimProvisioningConfig: AdminConfigType = {
  type: SettingCategories.SCIM_PROVISIONING,
  categoryType: CategoryType.ACL,
  controlType: SettingTypes.PAGE,
  title: "SCIM",
  subText: "Configure your identity provider on Appsmith below.",
  canSave: false,
  component: ScimProvisioning,
};

const featureFlags = selectFeatureFlags(store.getState());

const isFeatureEnabled = isSCIMEnabled(featureFlags);

//todo Dipyaman: Remove the isEnterprise checks once the enabled/disabled comes from the /features API correctly
export const config: AdminConfigType = {
  ...CE_config,
  ...(isFeatureEnabled
    ? {
        component: Provisioning,
        title: "Provisioning",
        canSave: false,
        children: [ScimProvisioningConfig],
        isFeatureEnabled: true,
      }
    : {}),
} as AdminConfigType;
