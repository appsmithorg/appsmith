import { AppsmithUIConfigs } from "./types";
import { Integrations } from "@sentry/tracing";
import * as Sentry from "@sentry/react";
import { createBrowserHistory } from "history";
const history = createBrowserHistory();

export interface INJECTED_CONFIGS {
  sentry: {
    dsn: string;
    release: string;
    environment: string;
  };
  smartLook: {
    id: string;
  };
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  disableLoginForm: boolean;
  disableSignup: boolean;
  enableRapidAPI: boolean;
  segment: {
    apiKey: string;
    ceKey: string;
  };
  fusioncharts: {
    licenseKey: string;
  };
  enableMixpanel: boolean;
  google: string;
  enableTNCPP: boolean;
  cloudHosting: boolean;
  algolia: {
    apiId: string;
    apiKey: string;
    indexName: string;
    snippetIndex: string;
  };
  logLevel: "debug" | "error";
  appVersion: {
    id: string;
    releaseDate: string;
  };
  intercomAppID: string;
  mailEnabled: boolean;
  cloudServicesBaseUrl: string;
  googleRecaptchaSiteKey: string;
  supportEmail: string;
}

const capitalizeText = (text: string) => {
  const rest = text.slice(1);
  const first = text[0].toUpperCase();
  return `${first}${rest}`;
};

export const getConfigsFromEnvVars = (): INJECTED_CONFIGS => {
  return {
    sentry: {
      dsn: process.env.REACT_APP_SENTRY_DSN || "",
      release: process.env.REACT_APP_SENTRY_RELEASE || "",
      environment:
        process.env.REACT_APP_SENTRY_ENVIRONMENT ||
        capitalizeText(process.env.NODE_ENV),
    },
    smartLook: {
      id: process.env.REACT_APP_SMART_LOOK_ID || "",
    },
    enableGoogleOAuth: process.env.REACT_APP_OAUTH2_GOOGLE_CLIENT_ID
      ? process.env.REACT_APP_OAUTH2_GOOGLE_CLIENT_ID.length > 0
      : false,
    enableGithubOAuth: process.env.REACT_APP_OAUTH2_GITHUB_CLIENT_ID
      ? process.env.REACT_APP_OAUTH2_GITHUB_CLIENT_ID.length > 0
      : false,
    disableLoginForm: !!process.env.APPSMITH_FORM_LOGIN_DISABLED,
    disableSignup: !!process.env.APPSMITH_SIGNUP_DISABLED,
    segment: {
      apiKey: process.env.REACT_APP_SEGMENT_KEY || "",
      ceKey: process.env.REACT_APP_SEGMENT_CE_KEY || "",
    },
    fusioncharts: {
      licenseKey: process.env.REACT_APP_FUSIONCHARTS_LICENSE_KEY || "",
    },
    enableMixpanel: process.env.REACT_APP_SEGMENT_KEY
      ? process.env.REACT_APP_SEGMENT_KEY.length > 0
      : false,
    algolia: {
      apiId: process.env.REACT_APP_ALGOLIA_API_ID || "",
      apiKey: process.env.REACT_APP_ALGOLIA_API_KEY || "",
      indexName: process.env.REACT_APP_ALGOLIA_SEARCH_INDEX_NAME || "",
      snippetIndex: process.env.REACT_APP_ALGOLIA_SNIPPET_INDEX_NAME || "",
    },
    logLevel:
      (process.env.REACT_APP_CLIENT_LOG_LEVEL as
        | "debug"
        | "error"
        | undefined) || "error",
    google: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    enableTNCPP: process.env.REACT_APP_TNC_PP
      ? process.env.REACT_APP_TNC_PP.length > 0
      : false,
    enableRapidAPI: process.env.REACT_APP_MARKETPLACE_URL
      ? process.env.REACT_APP_MARKETPLACE_URL.length > 0
      : false,
    cloudHosting: process.env.REACT_APP_CLOUD_HOSTING
      ? process.env.REACT_APP_CLOUD_HOSTING.length > 0
      : false,
    appVersion: {
      id: process.env.REACT_APP_VERSION_ID || "",
      releaseDate: process.env.REACT_APP_VERSION_RELEASE_DATE || "",
    },
    intercomAppID: process.env.REACT_APP_INTERCOM_APP_ID || "",
    mailEnabled: process.env.REACT_APP_MAIL_ENABLED
      ? process.env.REACT_APP_MAIL_ENABLED.length > 0
      : false,
    cloudServicesBaseUrl: process.env.REACT_APP_CLOUD_SERVICES_BASE_URL || "",
    googleRecaptchaSiteKey:
      process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY || "",
    supportEmail: process.env.APPSMITH_SUPPORT_EMAIL || "support@appsmith.com",
  };
};

const getConfig = (fromENV: string, fromWindow = "") => {
  if (fromWindow.length > 0) return { enabled: true, value: fromWindow };
  else if (fromENV.length > 0) return { enabled: true, value: fromENV };
  return { enabled: false, value: "" };
};

// TODO(Abhinav): See if this is called so many times, that we may need some form of memoization.
export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const { APPSMITH_FEATURE_CONFIGS } = window;
  const ENV_CONFIG = getConfigsFromEnvVars();

  // const sentry = getConfig(ENV_CONFIG.sentry, APPSMITH_FEATURE_CONFIGS.sentry);
  const sentryDSN = getConfig(
    ENV_CONFIG.sentry.dsn,
    APPSMITH_FEATURE_CONFIGS.sentry.dsn,
  );
  const sentryRelease = getConfig(
    ENV_CONFIG.sentry.release,
    APPSMITH_FEATURE_CONFIGS.sentry.release,
  );
  const sentryENV = getConfig(
    ENV_CONFIG.sentry.environment,
    APPSMITH_FEATURE_CONFIGS.sentry.environment,
  );
  const segment = getConfig(
    ENV_CONFIG.segment.apiKey,
    APPSMITH_FEATURE_CONFIGS.segment.apiKey,
  );
  const fusioncharts = getConfig(
    ENV_CONFIG.fusioncharts.licenseKey,
    APPSMITH_FEATURE_CONFIGS.fusioncharts.licenseKey,
  );
  const google = getConfig(ENV_CONFIG.google, APPSMITH_FEATURE_CONFIGS.google);

  const googleRecaptchaSiteKey = getConfig(
    ENV_CONFIG.googleRecaptchaSiteKey,
    APPSMITH_FEATURE_CONFIGS.googleRecaptchaSiteKey,
  );

  // As the following shows, the config variables can be set using a combination
  // of env variables and injected configs
  const smartLook = getConfig(
    ENV_CONFIG.smartLook.id,
    APPSMITH_FEATURE_CONFIGS.smartLook.id,
  );

  const algoliaAPIID = getConfig(
    ENV_CONFIG.algolia.apiId,
    APPSMITH_FEATURE_CONFIGS.algolia.apiId,
  );
  const algoliaAPIKey = getConfig(
    ENV_CONFIG.algolia.apiKey,
    APPSMITH_FEATURE_CONFIGS.algolia.apiKey,
  );
  const algoliaIndex = getConfig(
    ENV_CONFIG.algolia.indexName,
    APPSMITH_FEATURE_CONFIGS.algolia.indexName,
  );
  const algoliaSnippetIndex = getConfig(
    ENV_CONFIG.algolia.indexName,
    APPSMITH_FEATURE_CONFIGS.algolia.snippetIndex,
  );

  const segmentCEKey = getConfig(
    ENV_CONFIG.segment.ceKey,
    APPSMITH_FEATURE_CONFIGS.segment.ceKey,
  );

  // We enable segment tracking if either the Cloud API key is set or the self-hosted CE key is set
  segment.enabled = segment.enabled || segmentCEKey.enabled;

  return {
    sentry: {
      enabled: sentryDSN.enabled && sentryRelease.enabled && sentryENV.enabled,
      dsn: sentryDSN.value,
      release: sentryRelease.value,
      environment: sentryENV.value,
      normalizeDepth: 3,
      integrations: [
        new Integrations.BrowserTracing({
          // Can also use reactRouterV4Instrumentation
          routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
        }),
      ],
      tracesSampleRate: 0.1,
    },
    smartLook: {
      enabled: smartLook.enabled,
      id: smartLook.value,
    },
    segment: {
      enabled: segment.enabled,
      apiKey: segment.value,
      ceKey: segmentCEKey.value,
    },
    fusioncharts: {
      enabled: fusioncharts.enabled,
      licenseKey: fusioncharts.value,
    },
    algolia: {
      enabled: true,
      apiId: algoliaAPIID.value || "AZ2Z9CJSJ0",
      apiKey: algoliaAPIKey.value || "d113611dccb80ac14aaa72a6e3ac6d10",
      indexName: algoliaIndex.value || "test_appsmith",
      snippetIndex: algoliaSnippetIndex.value || "snippet",
    },
    google: {
      enabled: google.enabled,
      apiKey: google.value,
    },
    googleRecaptchaSiteKey: {
      enabled: googleRecaptchaSiteKey.enabled,
      apiKey: googleRecaptchaSiteKey.value,
    },
    enableRapidAPI:
      ENV_CONFIG.enableRapidAPI || APPSMITH_FEATURE_CONFIGS.enableRapidAPI,
    enableGithubOAuth:
      ENV_CONFIG.enableGithubOAuth ||
      APPSMITH_FEATURE_CONFIGS.enableGithubOAuth,
    disableLoginForm:
      ENV_CONFIG.disableLoginForm || APPSMITH_FEATURE_CONFIGS.disableLoginForm,
    disableSignup:
      ENV_CONFIG.disableSignup || APPSMITH_FEATURE_CONFIGS.disableSignup,
    enableGoogleOAuth:
      ENV_CONFIG.enableGoogleOAuth ||
      APPSMITH_FEATURE_CONFIGS.enableGoogleOAuth,
    enableMixpanel:
      ENV_CONFIG.enableMixpanel || APPSMITH_FEATURE_CONFIGS.enableMixpanel,
    cloudHosting:
      ENV_CONFIG.cloudHosting || APPSMITH_FEATURE_CONFIGS.cloudHosting,
    logLevel: ENV_CONFIG.logLevel || APPSMITH_FEATURE_CONFIGS.logLevel,
    enableTNCPP: ENV_CONFIG.enableTNCPP || APPSMITH_FEATURE_CONFIGS.enableTNCPP,
    appVersion: ENV_CONFIG.appVersion || APPSMITH_FEATURE_CONFIGS.appVersion,
    intercomAppID:
      ENV_CONFIG.intercomAppID || APPSMITH_FEATURE_CONFIGS.intercomAppID,
    mailEnabled: ENV_CONFIG.mailEnabled || APPSMITH_FEATURE_CONFIGS.mailEnabled,
    commentsTestModeEnabled: false,
    cloudServicesBaseUrl:
      ENV_CONFIG.cloudServicesBaseUrl ||
      APPSMITH_FEATURE_CONFIGS.cloudServicesBaseUrl,
    appsmithSupportEmail: ENV_CONFIG.supportEmail,
  };
};
