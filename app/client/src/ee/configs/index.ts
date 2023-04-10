export * from "ce/configs/index";
import type { AppsmithUIConfigs } from "./types";
import type { INJECTED_CONFIGS as CE_INJECTED_CONFIGS } from "ce/configs/index";
import {
  getAppsmithConfigs as CE_getAppsmithConfigs,
  getConfigsFromEnvVars as CE_getConfigsFromEnvVars,
} from "ce/configs/index";
import type { EvaluationVersion } from "@appsmith/api/ApplicationApi";

export interface INJECTED_CONFIGS extends CE_INJECTED_CONFIGS {
  enableSamlOAuth: boolean;
  enableOidcOAuth: boolean;
  airGapped: boolean;
}

declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: INJECTED_CONFIGS;
    Intercom: any;
    evaluationVersion: EvaluationVersion;
    Sentry: any;
  }
}

export const getConfigsFromEnvVars = (): INJECTED_CONFIGS => {
  return {
    ...CE_getConfigsFromEnvVars(),
    enableSamlOAuth: process.env.REACT_APP_SSO_SAML_ENABLED
      ? process.env.REACT_APP_SSO_SAML_ENABLED.length > 0
      : false,
    enableOidcOAuth: process.env.REACT_APP_OAUTH2_OIDC_CLIENT_ID
      ? process.env.REACT_APP_OAUTH2_OIDC_CLIENT_ID.length > 0
      : false,
    airGapped: process.env.REACT_APP_AIRGAP_ENABLED
      ? process.env.REACT_APP_AIRGAP_ENABLED.length > 0
      : false,
  };
};

export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const { APPSMITH_FEATURE_CONFIGS } = window;
  const ENV_CONFIG = getConfigsFromEnvVars();
  return {
    ...CE_getAppsmithConfigs(),
    enableSamlOAuth:
      ENV_CONFIG.enableSamlOAuth || APPSMITH_FEATURE_CONFIGS.enableSamlOAuth,
    enableOidcOAuth:
      ENV_CONFIG.enableOidcOAuth || APPSMITH_FEATURE_CONFIGS.enableOidcOAuth,
    enableAuditLogs: false,
    airGapped: ENV_CONFIG.airGapped || APPSMITH_FEATURE_CONFIGS.airGapped,
  };
};
