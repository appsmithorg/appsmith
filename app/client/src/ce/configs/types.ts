import type { LogLevelDesc } from "loglevel";

export interface SentryConfig {
  dsn: string;
  environment: string;
}

export interface AppVersionData {
  id: string;
  releaseDate: string;
  edition: string;
}

export interface AppsmithUIConfigs {
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

  enableRapidAPI: boolean;
  enableMixpanel: boolean;
  enableTNCPP: boolean;

  cloudHosting: boolean;

  logLevel: LogLevelDesc;
  appVersion: AppVersionData;
  intercomAppID: string;
  mailEnabled: boolean;

  cloudServicesBaseUrl: string;

  googleRecaptchaSiteKey: {
    enabled: boolean;
    apiKey: string;
  };
  appsmithSupportEmail: string;
  disableIframeWidgetSandbox: boolean;
  pricingUrl: string;
  customerPortalUrl: string;
}
