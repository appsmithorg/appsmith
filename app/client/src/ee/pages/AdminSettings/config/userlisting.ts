export * from "ce/pages/AdminSettings/config/userlisting";
import { config as CE_config } from "ce/pages/AdminSettings/config/userlisting";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";

import { isGACEnabled } from "@appsmith/utils/planHelpers";
import store from "store";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { UserListing } from "../AccessControl/UserListing";

const featureFlags = selectFeatureFlags(store.getState());

const isFeatureEnabled = isGACEnabled(featureFlags);

export const config: AdminConfigType = {
  ...CE_config,
  ...(isFeatureEnabled
    ? {
        type: SettingCategories.USER_LISTING,
        component: UserListing,
        title: "Users",
        needsUpgrade: !isFeatureEnabled,
        isFeatureEnabled: isFeatureEnabled,
      }
    : {}),
} as AdminConfigType;
