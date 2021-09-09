import { LogLevelDesc } from "loglevel";

export type SentryConfig = {
  dsn: string;
  environment: string;
};

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
    dsn: string;
    release: string;
    environment: string;
    integrations: any[];
    normalizeDepth: number;
    tracesSampleRate: number;
  };
  smartLook: {
    enabled: boolean;
    id: string;
  };
  segment: {
    enabled: boolean;
    apiKey: string;
    ceKey: string;
  };
  fusioncharts: {
    enabled: boolean;
    licenseKey: string;
  };
  algolia: {
    enabled: boolean;
    apiId: string;
    apiKey: string;
    indexName: string;
    snippetIndex: string;
  };

  google: {
    enabled: boolean;
    apiKey: string;
  };

  enableRapidAPI: boolean;
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  enableMixpanel: boolean;
  enableTNCPP: boolean;

  cloudHosting: boolean;

  featureFlag?: FeatureFlagConfig;
  logLevel: LogLevelDesc;
  appVersion: {
    id: string;
    releaseDate: string;
  };
  intercomAppID: string;
  mailEnabled: boolean;

  disableTelemetry: boolean;
  commentsTestModeEnabled: boolean;

  cloudServicesBaseUrl: string;

  googleRecaptchaSiteKey: {
    enabled: boolean;
    apiKey: string;
  };
  appsmithSupportEmail: string;
  isAppsmithCloud: boolean;
};
