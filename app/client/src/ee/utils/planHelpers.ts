import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export * from "ce/utils/planHelpers";

export const isAuditLogsEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_audit_logs_enabled;
};

export const isGACEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_gac_enabled;
};

export const isSCIMEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_scim_enabled;
};
