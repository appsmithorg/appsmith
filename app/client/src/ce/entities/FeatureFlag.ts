export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  DATASOURCE_ENVIRONMENTS: "DATASOURCE_ENVIRONMENTS",
  AUTO_LAYOUT: "AUTO_LAYOUT",
  ask_ai: "ask_ai",
  APP_NAVIGATION_LOGO_UPLOAD: "APP_NAVIGATION_LOGO_UPLOAD",
  ask_ai_sql: "ask_ai_sql",
  ask_ai_js: "ask_ai_js",
  APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY:
    "APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  DATASOURCE_ENVIRONMENTS: false,
  AUTO_LAYOUT: false,
  ask_ai: false,
  APP_NAVIGATION_LOGO_UPLOAD: false,
  ask_ai_js: false,
  ask_ai_sql: false,
  APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY: false,
};
