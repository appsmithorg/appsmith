export * from "ce/configs/index";
import type { AppsmithUIConfigs } from "./types";
import type { INJECTED_CONFIGS as CE_INJECTED_CONFIGS } from "ce/configs/index";
import {
  getAppsmithConfigs as CE_getAppsmithConfigs,
  getConfigsFromEnvVars as CE_getConfigsFromEnvVars,
} from "ce/configs/index";
import type { EvaluationVersion } from "@appsmith/api/ApplicationApi";

export interface INJECTED_CONFIGS extends CE_INJECTED_CONFIGS {
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

const airGapConfigVars = () => {
  const { segment, sentry, smartLook } = CE_getAppsmithConfigs();
  return {
    ...CE_getAppsmithConfigs(),
    sentry: {
      ...sentry,
      enabled: false,
      dsn: "",
      release: "",
      environment: "",
      integrations: [],
    },
    segment: {
      ...segment,
      enabled: false,
      apiKey: "",
      ceKey: "",
    },
    enableMixpanel: false,
    smartLook: {
      ...smartLook,
      enabled: false,
      id: "",
    },
  };
};

export const getConfigsFromEnvVars = (): INJECTED_CONFIGS => {
  return {
    ...CE_getConfigsFromEnvVars(),
    airGapped: process.env.REACT_APP_AIRGAP_ENABLED
      ? process.env.REACT_APP_AIRGAP_ENABLED.length > 0
      : false,
  };
};

export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const APPSMITH_FEATURE_CONFIGS =
    // This code might be called both from the main thread and a web worker
    typeof window === "undefined" ? undefined : window.APPSMITH_FEATURE_CONFIGS;
  const ENV_CONFIG = getConfigsFromEnvVars();

  const airGapped =
    ENV_CONFIG.airGapped || APPSMITH_FEATURE_CONFIGS?.airGapped || false;
  const airGappedConfigs = airGapped ? airGapConfigVars() : {};
  return {
    ...CE_getAppsmithConfigs(),
    ...airGappedConfigs,
    enableAuditLogs: false,
    airGapped,
  };
};
