import { LogLevelDesc } from "loglevel";

export type SentryConfig = {
  dsn: string;
  environment: string;
};

export type HotjarConfig = {
  id: string;
  sv: string;
};

type Milliseconds = number;

export enum FeatureFlagsEnum {}

export type FeatureFlags = Record<FeatureFlagsEnum, boolean>;

export type FeatureFlagConfig = {
  remoteConfig?: {
    optimizely: string;
  };
  default: FeatureFlags;
};

export type AppsmithUIConfigs = {
  sentry: {
    enabled: boolean;
    apiKey: string;
  };
  hotjar: {
    enabled: boolean;
    id: string;
    sv: string;
  };
  segment: {
    enabled: boolean;
    apiKey: string;
  };
  algolia: {
    enabled: boolean;
    apiId: string;
    apiKey: string;
    indexName: string;
  };

  google: {
    enabled: boolean;
    apiKey: string;
  };

  enableRapidAPI: boolean;
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  enableMixpanel: boolean;

  featureFlag?: FeatureFlagConfig;
  logLevel: LogLevelDesc;
};
