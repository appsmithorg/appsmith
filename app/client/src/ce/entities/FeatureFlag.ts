// Please follow naming convention : https://www.notion.so/appsmith/Using-Feature-Flags-in-Appsmith-d362fe7acc7d4ef0aa12e1f5f9b83b5f?pvs=4#f6d4242e56284e84af25cadef71b7aeb to create feature flags.
export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  release_datasource_environments_enabled:
    "release_datasource_environments_enabled",
  ask_ai: "ask_ai",
  release_appnavigationlogoupload_enabled:
    "release_appnavigationlogoupload_enabled",
  ask_ai_sql: "ask_ai_sql",
  ask_ai_js: "ask_ai_js",
  release_embed_hide_share_settings_enabled:
    "release_embed_hide_share_settings_enabled",
  ab_ds_schema_enabled: "ab_ds_schema_enabled",
  ab_ds_binding_enabled: "ab_ds_binding_enabled",
  release_scim_provisioning_enabled: "release_scim_provisioning_enabled",
  release_widgetdiscovery_enabled: "release_widgetdiscovery_enabled",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  release_datasource_environments_enabled: false,
  ask_ai: false,
  release_appnavigationlogoupload_enabled: false,
  ask_ai_js: false,
  ask_ai_sql: false,
  release_embed_hide_share_settings_enabled: false,
  ab_ds_schema_enabled: false,
  ab_ds_binding_enabled: false,
  release_scim_provisioning_enabled: false,
  release_widgetdiscovery_enabled: false,
};

export const AB_TESTING_EVENT_KEYS = {
  abTestingFlagLabel: "abTestingFlagLabel",
  abTestingFlagValue: "abTestingFlagValue",
};
