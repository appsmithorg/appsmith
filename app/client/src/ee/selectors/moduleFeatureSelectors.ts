/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector } from "reselect";

import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";

/**
 * Checks if the release_query_module_enabled feature flag is enabled and if the
 * current instance is cloud hosted. This is the base condition for enabling
 * query modules + the base functionalities of packages.
 *
 * @returns boolean
 */
export const getShowQueryModule = createSelector(
  selectFeatureFlags,
  (featureFlags) => {
    const { cloudHosting } = getAppsmithConfigs();

    return !cloudHosting && featureFlags.release_query_module_enabled;
  },
);

/**
 * Checks if the release_ui_module_enabled feature flag is enabled and if the
 * current instance is cloud hosted. This is the base condition for enabling
 * ui modules only. To enable all features and UI modules both release_query_module_enabled
 * and release_ui_module_enabled has to be enabled
 *
 * @returns boolean
 */
export const getShowUIModule = createSelector(
  selectFeatureFlags,
  (featureFlags) => {
    const { cloudHosting } = getAppsmithConfigs();

    return !cloudHosting && featureFlags.release_ui_module_enabled;
  },
);
