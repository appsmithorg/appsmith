import { LogLevelDesc } from "loglevel";
import { FeatureFlagEnum } from "utils/featureFlags";

export type SentryConfig = {
  dsn: string;
  environment: string;
};

export type HotjarConfig = {
  id: string;
  sv: string;
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
  segment: {
    enabled: boolean;
    key: string;
  };
  apiUrl: string;
  baseUrl: string;
  logLevel: LogLevelDesc;
  featureFlags: Array<FeatureFlagEnum>;
};
