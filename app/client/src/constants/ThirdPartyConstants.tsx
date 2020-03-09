export type ENVIRONMENT = "PRODUCTION" | "STAGING" | "LOCAL";
export const SENTRY_PROD_CONFIG = {
  dsn: "https://a63362b692d64edeb175741f1f80b091@sentry.io/1546547",
  environment: "Production",
  release: process.env.REACT_APP_SENTRY_RELEASE,
};
export const SENTRY_STAGE_CONFIG = {
  dsn: "https://26e99889a7f14b418a66cb2deafeb40c@sentry.io/4113637",
  environment: "Staging",
  release: process.env.REACT_APP_SENTRY_RELEASE,
};

export const HOTJAR_PROD_HJID = "1465835";
export const HOTJAR_PROD_HJSV = "6";
