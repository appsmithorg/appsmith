import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export * from "ce/utils/planHelpers";

/**
 * Checks if the audit logs feature is enabled in the provided feature flags.
 * @param featureFlags - The feature flags object to check.
 * @returns True if the audit logs feature is enabled, false otherwise.
 */
export const isAuditLogsEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_audit_logs_enabled;
};

/**
 * Checks if the Ask AI SQL feature flag is enabled.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether the Ask AI SQL feature flag is enabled.
 */
export const isAskAISQLEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai_sql;
};

/**
 * Checks if the Ask AI JS feature flag is enabled.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether the Ask AI JS feature flag is enabled.
 */
export const isAskAIJSEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai_js;
};

/**
 * Checks if the user session limit feature is enabled in the provided feature flags.
 * @param featureFlags - The feature flags object to check.
 * @returns True if the user session limit feature is enabled, false otherwise.
 */
export const isUserSessionLimitEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_session_limit_enabled;
};

/**
 * Checks if programmatic access control is enabled based on the provided feature flags.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether programmatic access control is enabled.
 */
export const isProgramaticAccessControlEnabled = (
  featureFlags: FeatureFlags,
) => {
  return featureFlags?.license_pac_enabled;
};

/**
 * Checks if the GAC (Global Access Control) feature is enabled in the current license.
 * @param featureFlags - The feature flags object containing the license_gac_enabled property.
 * @returns A boolean indicating whether the GAC feature is enabled or not.
 */
export const isGACEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_gac_enabled;
};

/**
 * Checks if SCIM is enabled in the feature flags.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether SCIM is enabled.
 */
export const isSCIMEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_scim_enabled;
};

/**
 * Checks if the window message listener is enabled based on the feature flags.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether the window message listener is enabled or not.
 */
export const isWindowMessageListenerEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.license_message_listener_enabled;
};

/**
 * Checks if the Ask AI feature is enabled based on the provided feature flags.
 * @param featureFlags - The feature flags object.
 * @returns A boolean indicating whether the Ask AI feature is enabled or not.
 */
export const isAskAIEnabled = (featureFlags: FeatureFlags) => {
  return featureFlags?.ask_ai;
};

export const isAskAIFunctionCompletionEnabled = (
  featureFlags: FeatureFlags,
) => {
  return featureFlags?.ab_ai_js_function_completion_enabled;
};
