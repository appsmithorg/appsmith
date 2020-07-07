import { AppsmithUIConfigs, FeatureFlagConfig } from "./types";
type INJECTED_CONFIGS = {
  sentry: string;
  hotjar: {
    id: string;
    sv: string;
  };
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  enableRapidAPI: boolean;
  segment: string;
  optimizely: string;
  enableMixpanel: boolean;
  google: string;
  enableTNCPP: boolean;
  algolia: {
    apiId: string;
    apiKey: string;
    indexName: string;
  };
  logLevel: "debug" | "error";
};
declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: INJECTED_CONFIGS;
  }
}

const getConfigsFromEnvVars = (): INJECTED_CONFIGS => {
  return {
    sentry: process.env.REACT_APP_SENTRY_DSN || "",
    hotjar: {
      id: process.env.REACT_APP_HOTJAR_HJID || "",
      sv: process.env.REACT_APP_HOTJAR_HJSV || "",
    },
    enableGoogleOAuth: process.env.REACT_APP_OAUTH2_GOOGLE_CLIENT_ID
      ? process.env.REACT_APP_OAUTH2_GOOGLE_CLIENT_ID.length > 0
      : false,
    enableGithubOAuth: process.env.REACT_APP_OAUTH2_GITHUB_CLIENT_ID
      ? process.env.REACT_APP_OAUTH2_GITHUB_CLIENT_ID.length > 0
      : false,
    segment: process.env.REACT_APP_SEGMENT_KEY || "",
    optimizely: process.env.REACT_APP_OPTIMIZELY_KEY || "",
    enableMixpanel: process.env.REACT_APP_SEGMENT_KEY
      ? process.env.REACT_APP_SEGMENT_KEY.length > 0
      : false,
    algolia: {
      apiId: process.env.REACT_APP_ALGOLIA_API_ID || "",
      apiKey: process.env.REACT_APP_ALGOLIA_API_KEY || "",
      indexName: process.env.REACT_APP_ALGOLIA_SEARCH_INDEX_NAME || "",
    },
    logLevel:
      (process.env.REACT_APP_CLIENT_LOG_LEVEL as
        | "debug"
        | "error"
        | undefined) || "debug",
    google: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    enableTNCPP: process.env.REACT_APP_TNC_PP
      ? process.env.REACT_APP_TNC_PP.length > 0
      : false,
    enableRapidAPI: process.env.REACT_APP_MARKETPLACE_URL
      ? process.env.REACT_APP_MARKETPLACE_URL.length > 0
      : false,
  };
};

const getConfig = (fromENV: string, fromWindow: string) => {
  if (fromENV.length > 0) return { enabled: true, value: fromENV };
  else if (fromWindow.length > 0) return { enabled: true, value: fromWindow };
  return { enabled: false, value: "" };
};

// TODO(Abhinav): See if this is called so many times, that we may need some form of memoization.
export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const { APPSMITH_FEATURE_CONFIGS } = window;
  const ENV_CONFIG = getConfigsFromEnvVars();
  const getFeatureFlags = (
    optimizelyApiKey: string,
  ): FeatureFlagConfig | undefined => {
    if (optimizelyApiKey.length > 0) {
      return {
        remoteConfig: {
          optimizely: optimizelyApiKey,
        },
        default: {},
      };
    }
    return;
  };

  const sentry = getConfig(ENV_CONFIG.sentry, APPSMITH_FEATURE_CONFIGS.sentry);
  const segment = getConfig(
    ENV_CONFIG.segment,
    APPSMITH_FEATURE_CONFIGS.segment,
  );
  const google = getConfig(ENV_CONFIG.google, APPSMITH_FEATURE_CONFIGS.google);

  // As the following shows, the config variables can be set using a combination
  // of env variables and injected configs
  const hotjarId = getConfig(
    ENV_CONFIG.hotjar.id,
    APPSMITH_FEATURE_CONFIGS.hotjar.id,
  );
  const hotjarSV = getConfig(
    ENV_CONFIG.hotjar.sv,
    APPSMITH_FEATURE_CONFIGS.hotjar.sv,
  );

  const algoliaAPIID = getConfig(
    ENV_CONFIG.algolia.apiId,
    APPSMITH_FEATURE_CONFIGS.algolia.apiKey,
  );
  const algoliaAPIKey = getConfig(
    ENV_CONFIG.algolia.apiKey,
    APPSMITH_FEATURE_CONFIGS.algolia.apiKey,
  );
  const algoliaIndex = getConfig(
    ENV_CONFIG.algolia.indexName,
    APPSMITH_FEATURE_CONFIGS.algolia.indexName,
  );

  return {
    sentry: { enabled: sentry.enabled, apiKey: sentry.value },
    hotjar: {
      enabled: hotjarId.enabled && hotjarSV.enabled,
      id: hotjarId.value,
      sv: hotjarSV.value, //parse as int?
    },
    segment: {
      enabled: segment.enabled,
      apiKey: segment.value,
    },
    algolia: {
      enabled: true,
      apiId: algoliaAPIID.value || "AZ2Z9CJSJ0",
      apiKey: algoliaAPIKey.value || "d113611dccb80ac14aaa72a6e3ac6d10",
      indexName: algoliaIndex.value || "test_appsmith",
    },
    google: {
      enabled: google.enabled,
      apiKey: google.value,
    },
    enableRapidAPI:
      ENV_CONFIG.enableRapidAPI || APPSMITH_FEATURE_CONFIGS.enableRapidAPI,
    enableGithubOAuth:
      ENV_CONFIG.enableGithubOAuth ||
      APPSMITH_FEATURE_CONFIGS.enableGithubOAuth,
    enableGoogleOAuth:
      ENV_CONFIG.enableGoogleOAuth ||
      APPSMITH_FEATURE_CONFIGS.enableGoogleOAuth,
    enableMixpanel:
      ENV_CONFIG.enableMixpanel || APPSMITH_FEATURE_CONFIGS.enableMixpanel,
    featureFlag: getFeatureFlags(
      ENV_CONFIG.optimizely || APPSMITH_FEATURE_CONFIGS.optimizely,
    ),
    logLevel: ENV_CONFIG.logLevel || APPSMITH_FEATURE_CONFIGS.logLevel,
    enableTNCPP: ENV_CONFIG.enableTNCPP || APPSMITH_FEATURE_CONFIGS.enableTNCPP,
  };
};
