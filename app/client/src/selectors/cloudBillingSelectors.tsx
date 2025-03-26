import { createSelector } from "reselect";

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";

/**
 * Checks if the cloud billing is enabled via the license_multi_org_enabled feature flag
 *
 * @returns boolean
 */
export const getIsCloudBillingFeatureFlagEnabled = createSelector(
  selectFeatureFlags,
  (featureFlags) => featureFlags.license_multi_org_enabled,
);
