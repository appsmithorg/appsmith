import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export * from "ce/utils/planHelpers";

export const isAuditLogsEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_audit_logs_enabled;
};
