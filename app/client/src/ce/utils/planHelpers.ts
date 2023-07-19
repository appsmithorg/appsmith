import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";

//if feature flag is false then needs upgrade is true
export const isUpgradeNeededForBranding = () => {
  const brandingFeatureEnabled = selectFeatureFlagCheck(
    store.getState(),
    FEATURE_FLAG.license_branding_enabled,
  );
  return !brandingFeatureEnabled;
};
