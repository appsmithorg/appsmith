import { AppsmithUIConfigs, FeatureFlagConfig } from "./types";
declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: {
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
    };
  }
}

// TODO(Abhinav): See if this is called so many times, that we may need some form of memoization.
export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const { APPSMITH_FEATURE_CONFIGS } = window;
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

  return {
    sentry: {
      enabled: APPSMITH_FEATURE_CONFIGS.sentry.length > 0,
      apiKey: APPSMITH_FEATURE_CONFIGS.sentry,
    },
    hotjar: {
      enabled:
        APPSMITH_FEATURE_CONFIGS.hotjar.id.length > 0 &&
        APPSMITH_FEATURE_CONFIGS.hotjar.sv.length > 0,
      id: APPSMITH_FEATURE_CONFIGS.hotjar.id,
      sv: APPSMITH_FEATURE_CONFIGS.hotjar.sv, //parse as int?
    },
    segment: {
      enabled: APPSMITH_FEATURE_CONFIGS.segment.length > 0,
      apiKey: APPSMITH_FEATURE_CONFIGS.segment,
    },
    algolia: {
      enabled:
        APPSMITH_FEATURE_CONFIGS.algolia.apiId.length > 0 &&
        APPSMITH_FEATURE_CONFIGS.algolia.apiKey.length > 0 &&
        APPSMITH_FEATURE_CONFIGS.algolia.indexName.length > 0,
      apiId: APPSMITH_FEATURE_CONFIGS.algolia.apiId,
      apiKey: APPSMITH_FEATURE_CONFIGS.algolia.apiKey,
      indexName: APPSMITH_FEATURE_CONFIGS.algolia.indexName,
    },
    google: {
      enabled: APPSMITH_FEATURE_CONFIGS.google.length > 0,
      apiKey: APPSMITH_FEATURE_CONFIGS.google,
    },
    enableRapidAPI: APPSMITH_FEATURE_CONFIGS.enableRapidAPI,
    enableGithubOAuth: APPSMITH_FEATURE_CONFIGS.enableGithubOAuth,
    enableGoogleOAuth: APPSMITH_FEATURE_CONFIGS.enableGoogleOAuth,
    enableMixpanel: APPSMITH_FEATURE_CONFIGS.enableMixpanel,
    featureFlag: getFeatureFlags(APPSMITH_FEATURE_CONFIGS.optimizely),
    logLevel: "debug",
    enableTNCPP: APPSMITH_FEATURE_CONFIGS.enableTNCPP,
  };
};
