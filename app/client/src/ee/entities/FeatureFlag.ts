export * from "ce/entities/FeatureFlag";
import {
  FEATURE_FLAG as CE_FEATURE_FLAG,
  DEFAULT_FEATURE_FLAG_VALUE as CE_DEFAULT_FEATURE_FLAG_VALUE,
} from "ce/entities/FeatureFlag";

const EE_FEATURE_FLAG = {
  ask_ai: "ask_ai",
  ask_ai_js: "ask_ai_js",
  ask_ai_sql: "ask_ai_sql",
  ab_ai_js_function_completion_enabled: "ab_ai_js_function_completion_enabled",
  TEST_EE_FLAG: "TEST_EE_FLAG",
  license_audit_logs_enabled: "license_audit_logs_enabled",
  license_custom_environments_enabled: "license_custom_environments_enabled",
  license_connection_pool_size_enabled: "license_connection_pool_size_enabled",
  release_knowledge_base_enabled: "release_knowledge_base_enabled",
  license_session_limit_enabled: "license_session_limit_enabled",
  license_pac_enabled: "license_pac_enabled",
  license_message_listener_enabled: "license_message_listener_enabled",
  ab_ai_button_sql_enabled: "ab_ai_button_sql_enabled",
  license_scim_enabled: "license_scim_enabled",
  release_query_module_enabled: "release_query_module_enabled",
  ab_env_walkthrough_enabled: "ab_env_walkthrough_enabled",
} as const;

export const EE_DEFAULT_FEATURE_FLAG_VALUE: EE_FeatureFlags = {
  ask_ai: false,
  ask_ai_js: false,
  ask_ai_sql: false,
  ab_ai_js_function_completion_enabled: false,
  TEST_EE_FLAG: true,
  license_audit_logs_enabled: false,
  license_custom_environments_enabled: false,
  license_connection_pool_size_enabled: false,
  release_knowledge_base_enabled: false,
  license_session_limit_enabled: false,
  license_pac_enabled: false,
  license_message_listener_enabled: false,
  release_query_module_enabled: false,
  ab_ai_button_sql_enabled: false,
  license_scim_enabled: false,
  ab_env_walkthrough_enabled: false,
};

export type EE_FeatureFlag = keyof typeof EE_FEATURE_FLAG;
export type EE_FeatureFlags = Record<EE_FeatureFlag, boolean>;

export const FEATURE_FLAG = {
  ...CE_FEATURE_FLAG,
  ...EE_FEATURE_FLAG,
} as const;

export const DEFAULT_FEATURE_FLAG_VALUE = {
  ...CE_DEFAULT_FEATURE_FLAG_VALUE,
  ...EE_DEFAULT_FEATURE_FLAG_VALUE,
};

export type FeatureFlag = keyof typeof FEATURE_FLAG;
export type FeatureFlags = Record<FeatureFlag, boolean>;
