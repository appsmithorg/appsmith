import type { LogLevelDesc } from "loglevel";

export interface AppVersionData {
  id: string;
  sha: string;
  releaseDate: string;
  edition: string;
}

export interface AppsmithUIConfigs {
  sentry: {
    enabled: boolean;
    dsn: string;
    release: string;
    environment: string;
    normalizeDepth: number;
    tracesSampleRate: number;
  };
  smartLook: {
    enabled: boolean;
    id: string;
  };
  observability: {
    deploymentName: string;
    serviceInstanceId: string;
    serviceName: string;
    tracingUrl: string;
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

  mixpanel: {
    enabled: boolean;
    apiKey: string;
  };

  cloudHosting: boolean;

  logLevel: LogLevelDesc;
  appVersion: AppVersionData;
  intercomAppID: string;
  mailEnabled: boolean;

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
