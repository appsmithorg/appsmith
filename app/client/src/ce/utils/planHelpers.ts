import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

//if feature flag is true then return feature is enbaled
export const isBrandingEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_branding_enabled;
};

export const isSSOEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_sso_enabled;
};
