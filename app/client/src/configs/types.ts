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
  };
  apiUrl: string;
  baseUrl: string;
};
