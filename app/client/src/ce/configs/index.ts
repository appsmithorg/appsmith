import type { AppsmithUIConfigs } from "./types";

export interface INJECTED_CONFIGS {
  sentry: {
    dsn: string;
    release: string;
    environment: string;
  };
  smartLook: {
    id: string;
  };
  segment: {
    apiKey: string;
    ceKey: string;
  };
  observability: {
    deploymentName: string;
    serviceInstanceId: string;
  };
  newRelic: {
    enableNewRelic: boolean;
    accountId: string;
    applicationId: string;
    browserAgentlicenseKey: string;
    browserAgentEndpoint: string;
    otlpLicenseKey: string;
    otlpEndpoint: string;
  };
  fusioncharts: {
    licenseKey: string;
  };
  mixpanel: {
    enabled: boolean;
    apiKey: string;
  };
  cloudHosting: boolean;
  logLevel: "debug" | "error";
  appVersion: {
    id: string;
    sha: string;
    releaseDate: string;
    edition: string;
  };
  intercomAppID: string;
  mailEnabled: boolean;
  googleRecaptchaSiteKey: string;
  supportEmail: string;
  disableIframeWidgetSandbox: boolean;
  pricingUrl: string;
  customerPortalUrl: string;
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
    segment: {
      apiKey: process.env.REACT_APP_SEGMENT_KEY || "",
      ceKey: process.env.REACT_APP_SEGMENT_CE_KEY || "",
    },
    fusioncharts: {
      licenseKey: process.env.REACT_APP_FUSIONCHARTS_LICENSE_KEY || "",
    },
    mixpanel: {
      enabled: process.env.REACT_APP_SEGMENT_KEY
        ? process.env.REACT_APP_SEGMENT_KEY.length > 0
        : false,
      apiKey: process.env.REACT_APP_MIXPANEL_KEY || "",
    },
    observability: {
      deploymentName: process.env.APPSMITH_DEPLOYMENT_NAME || "self-hosted",
      serviceInstanceId: process.env.HOSTNAME || "appsmith-0",
    },
    newRelic: {
      enableNewRelic: !!process.env.APPSMITH_NEW_RELIC_ACCOUNT_ENABLE,
      accountId: process.env.APPSMITH_NEW_RELIC_ACCOUNT_ID || "",
      applicationId: process.env.APPSMITH_NEW_RELIC_APPLICATION_ID || "",
      browserAgentlicenseKey:
        process.env.APPSMITH_NEW_RELIC_BROWSER_AGENT_LICENSE_KEY || "",
      browserAgentEndpoint:
        process.env.APPSMITH_NEW_RELIC_BROWSER_AGENT_ENDPOINT || "",
      otlpLicenseKey: process.env.APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY || "",
      otlpEndpoint: process.env.APPSMITH_NEW_RELIC_OTEL_SERVICE_NAME || "",
    },
    logLevel:
      (process.env.REACT_APP_CLIENT_LOG_LEVEL as
        | "debug"
        | "error"
        | undefined) || "error",
    cloudHosting: process.env.REACT_APP_CLOUD_HOSTING
      ? process.env.REACT_APP_CLOUD_HOSTING.length > 0
      : false,
    appVersion: {
      id: "",
      sha: "",
      releaseDate: "",
      edition: process.env.REACT_APP_VERSION_EDITION || "",
    },
    intercomAppID: process.env.REACT_APP_INTERCOM_APP_ID || "",
    mailEnabled: process.env.REACT_APP_MAIL_ENABLED
      ? process.env.REACT_APP_MAIL_ENABLED.length > 0
      : false,
    googleRecaptchaSiteKey:
      process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY || "",
    supportEmail: process.env.APPSMITH_SUPPORT_EMAIL || "support@appsmith.com",

    disableIframeWidgetSandbox: process.env
      .APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX
      ? process.env.APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX.length > 0
      : false,
    pricingUrl: process.env.REACT_APP_PRICING_URL || "",
    customerPortalUrl: process.env.REACT_APP_CUSTOMER_PORTAL_URL || "",
  };
};

const getConfig = (fromENV: string, fromWindow = "") => {
  if (fromWindow.length > 0) return { enabled: true, value: fromWindow };
  else if (fromENV.length > 0) return { enabled: true, value: fromENV };

  return { enabled: false, value: "" };
};

// TODO(Abhinav): See if this is called so many times, that we may need some form of memoization.
export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const APPSMITH_FEATURE_CONFIGS =
    // This code might be called both from the main thread and a web worker
    typeof window === "undefined" ? undefined : window.APPSMITH_FEATURE_CONFIGS;
  const ENV_CONFIG = getConfigsFromEnvVars();
  // const sentry = getConfig(ENV_CONFIG.sentry, APPSMITH_FEATURE_CONFIGS.sentry);
  const sentryDSN = getConfig(
    ENV_CONFIG.sentry.dsn,
    APPSMITH_FEATURE_CONFIGS?.sentry.dsn,
  );
  const sentryRelease = getConfig(
    ENV_CONFIG.sentry.release,
    APPSMITH_FEATURE_CONFIGS?.sentry.release,
  );
  const sentryENV = getConfig(
    ENV_CONFIG.sentry.environment,
    APPSMITH_FEATURE_CONFIGS?.sentry.environment,
  );
  const segment = getConfig(
    ENV_CONFIG.segment.apiKey,
    APPSMITH_FEATURE_CONFIGS?.segment.apiKey,
  );
  const mixpanel = getConfig(
    ENV_CONFIG.mixpanel.apiKey,
    APPSMITH_FEATURE_CONFIGS?.mixpanel.apiKey,
  );
  const observabilityDeploymentName = getConfig(
    ENV_CONFIG.observability.deploymentName,
    APPSMITH_FEATURE_CONFIGS?.observability.deploymentName,
  );
  const observabilityServiceInstanceId = getConfig(
    ENV_CONFIG.observability.serviceInstanceId,
    APPSMITH_FEATURE_CONFIGS?.observability.serviceInstanceId,
  );
  const newRelicAccountId = getConfig(
    ENV_CONFIG.newRelic.accountId,
    APPSMITH_FEATURE_CONFIGS?.newRelic.accountId,
  );
  const newRelicApplicationId = getConfig(
    ENV_CONFIG.newRelic.applicationId,
    APPSMITH_FEATURE_CONFIGS?.newRelic.applicationId,
  );
  const newRelicBrowserLicenseKey = getConfig(
    ENV_CONFIG.newRelic.browserAgentlicenseKey,
    APPSMITH_FEATURE_CONFIGS?.newRelic.browserAgentlicenseKey,
  );
  const newRelicBrowserAgentEndpoint = getConfig(
    ENV_CONFIG.newRelic.browserAgentEndpoint,
    APPSMITH_FEATURE_CONFIGS?.newRelic.browserAgentEndpoint,
  );
  const newRelicOtlpLicenseKey = getConfig(
    ENV_CONFIG.newRelic.otlpLicenseKey,
    APPSMITH_FEATURE_CONFIGS?.newRelic.otlpLicenseKey,
  );
  const newRelicOtlpEndpoint = getConfig(
    ENV_CONFIG.newRelic.otlpEndpoint,
    APPSMITH_FEATURE_CONFIGS?.newRelic.otlpEndpoint,
  );
  const fusioncharts = getConfig(
    ENV_CONFIG.fusioncharts.licenseKey,
    APPSMITH_FEATURE_CONFIGS?.fusioncharts.licenseKey,
  );

  const googleRecaptchaSiteKey = getConfig(
    ENV_CONFIG.googleRecaptchaSiteKey,
    APPSMITH_FEATURE_CONFIGS?.googleRecaptchaSiteKey,
  );

  // As the following shows, the config variables can be set using a combination
  // of env variables and injected configs
  const smartLook = getConfig(
    ENV_CONFIG.smartLook.id,
    APPSMITH_FEATURE_CONFIGS?.smartLook.id,
  );

  const segmentCEKey = getConfig(
    ENV_CONFIG.segment.ceKey,
    APPSMITH_FEATURE_CONFIGS?.segment.ceKey,
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
    // TODO @diljit - Remove the following keys from the feature configs
    newRelic: {
      enableNewRelic:
        ENV_CONFIG.newRelic.enableNewRelic ||
        APPSMITH_FEATURE_CONFIGS?.newRelic.enableNewRelic ||
        false,
      accountId: newRelicAccountId.value,
      applicationId: newRelicApplicationId.value,
      browserAgentlicenseKey: newRelicBrowserLicenseKey.value,
      browserAgentEndpoint: newRelicBrowserAgentEndpoint.value,
      otlpLicenseKey: newRelicOtlpLicenseKey.value,
      otlpEndpoint: newRelicOtlpEndpoint.value,
    },
    observability: {
      // TODO @diljit - Add faro related keys here
      deploymentName: observabilityDeploymentName.value,
      serviceInstanceId: observabilityServiceInstanceId.value,
      serviceName: "appsmith-client",
    },
    fusioncharts: {
      enabled: fusioncharts.enabled,
      licenseKey: fusioncharts.value,
    },
    googleRecaptchaSiteKey: {
      enabled: googleRecaptchaSiteKey.enabled,
      apiKey: googleRecaptchaSiteKey.value,
    },
    mixpanel: {
      enabled: segment.enabled,
      apiKey: mixpanel.value,
    },
    cloudHosting:
      ENV_CONFIG.cloudHosting ||
      APPSMITH_FEATURE_CONFIGS?.cloudHosting ||
      false,
    logLevel:
      ENV_CONFIG.logLevel || APPSMITH_FEATURE_CONFIGS?.logLevel || false,
    appVersion: {
      id: APPSMITH_FEATURE_CONFIGS?.appVersion?.id || "",
      sha: APPSMITH_FEATURE_CONFIGS?.appVersion?.sha || "",
      releaseDate: APPSMITH_FEATURE_CONFIGS?.appVersion?.releaseDate || "",
      edition:
        ENV_CONFIG.appVersion?.edition ||
        APPSMITH_FEATURE_CONFIGS?.appVersion?.edition ||
        "",
    },
    intercomAppID:
      ENV_CONFIG.intercomAppID || APPSMITH_FEATURE_CONFIGS?.intercomAppID || "",
    mailEnabled:
      ENV_CONFIG.mailEnabled || APPSMITH_FEATURE_CONFIGS?.mailEnabled || false,
    appsmithSupportEmail: ENV_CONFIG.supportEmail,
    disableIframeWidgetSandbox:
      ENV_CONFIG.disableIframeWidgetSandbox ||
      APPSMITH_FEATURE_CONFIGS?.disableIframeWidgetSandbox ||
      false,
    pricingUrl:
      ENV_CONFIG.pricingUrl || APPSMITH_FEATURE_CONFIGS?.pricingUrl || "",
    customerPortalUrl:
      ENV_CONFIG.customerPortalUrl ||
      APPSMITH_FEATURE_CONFIGS?.customerPortalUrl ||
      "",
  };
};
