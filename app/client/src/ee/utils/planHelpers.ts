import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export * from "ce/utils/planHelpers";

export const isAuditLogsEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_audit_logs_enabled;
};

export const isUserSessionLimitEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_session_limit_enabled;
};

export const isProgramaticAccessControlEnabled = (
  featureFlags: FeatureFlags,
) => {
  return featureFlags?.license_pac_enabled;
};
