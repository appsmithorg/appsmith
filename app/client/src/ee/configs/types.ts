import {
  SentryConfig as CE_SentryConfig,
  FeatureFlags as CE_FeatureFlags,
  FeatureFlagConfig as CE_FeatureFlagConfig,
  AppsmithUIConfigs as CE_AppsmithUIConfigs,
} from "ce/configs/types";

export type SentryConfig = CE_SentryConfig;
export type FeatureFlags = CE_FeatureFlags;
export type FeatureFlagConfig = CE_FeatureFlagConfig;

export interface AppsmithUIConfigs extends CE_AppsmithUIConfigs {
  enableKeycloakOAuth: boolean;
  enableOidcOAuth: boolean;
}
