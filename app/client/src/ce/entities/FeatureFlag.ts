// Please follow naming convention : https://www.notion.so/appsmith/Using-Feature-Flags-in-Appsmith-d362fe7acc7d4ef0aa12e1f5f9b83b5f?pvs=4#f6d4242e56284e84af25cadef71b7aeb to create feature flags.
export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  release_datasource_environments_enabled:
    "release_datasource_environments_enabled",
  ask_ai: "ask_ai",
  APP_NAVIGATION_LOGO_UPLOAD: "APP_NAVIGATION_LOGO_UPLOAD",
  ask_ai_sql: "ask_ai_sql",
  ask_ai_js: "ask_ai_js",
  APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY:
    "APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY",
  ab_ds_schema_enabled: "ab_ds_schema_enabled",
  ab_ds_binding_enabled: "ab_ds_binding_enabled",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  release_datasource_environments_enabled: false,
  ask_ai: false,
  APP_NAVIGATION_LOGO_UPLOAD: false,
  ask_ai_js: false,
  ask_ai_sql: false,
  APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY: false,
  ab_ds_schema_enabled: false,
  ab_ds_binding_enabled: false,
};

export const AB_TESTING_EVENT_KEYS = {
  abTestingFlagLabel: "abTestingFlagLabel",
  abTestingFlagValue: "abTestingFlagValue",
};
