import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export * from "ce/utils/planHelpers";

export const isAuditLogsEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_audit_logs_enabled;
};

export const isAskAISQLEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai_sql;
};

export const isAskAIJSEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai_js;
};

export const isUserSessionLimitEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_session_limit_enabled;
};

export const isProgramaticAccessControlEnabled = (
  featureFlags: FeatureFlags,
) => {
  return featureFlags?.license_pac_enabled;
};

export const isWindowMessageListenerEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_message_listener_enabled;
};

export const isAskAIEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai;
};
