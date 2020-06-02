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

export enum FeatureFlagsEnum {
  ApiPaneV2 = "apipanev2",
  DatasourcePane = "datasourcepane",
  QueryPane = "querypane",
  documentationV2 = "documentationv2",
  LightningMenu = "lightningmenu",
}

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
    config?: SentryConfig;
  };
  hotjar: {
    enabled: boolean;
    config?: HotjarConfig;
  };
  featureFlag: FeatureFlagConfig;
  segment: {
    enabled: boolean;
    key: string;
  };
  apiUrl: string;
  baseUrl: string;
  logLevel: LogLevelDesc;
};
