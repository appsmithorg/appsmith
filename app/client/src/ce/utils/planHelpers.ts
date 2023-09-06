import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

//if feature flag is true then return feature is enabled
export const isBrandingEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_branding_enabled;
};

export const isOIDCEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_sso_oidc_enabled;
};

export const isSAMLEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_sso_saml_enabled;
};
