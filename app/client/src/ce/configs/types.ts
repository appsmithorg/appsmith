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
  newRelic: {
    enableNewRelic: boolean;
    accountId: string;
    applicationId: string;
    browserAgentlicenseKey: string;
    otlpLicenseKey: string;
    otlpServiceName: string;
    otlpEndpoint: string;
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

export interface DatasourceMeta {
  configuredDatasources: number;
  totalDatasources: number;
}

// Type for one environment
export interface EnvironmentType {
  id: string;
  name: string;
  workspaceId: string;
  isDefault?: boolean;
  isLocked: boolean; // Whether the environment is locked (disables editing and deleting of the env)
  userPermissions?: string[];
  datasourceMeta?: DatasourceMeta;
}
