export * from "ce/configs/types";
import {
  SentryConfig as CE_SentryConfig,
  AppsmithUIConfigs as CE_AppsmithUIConfigs,
} from "ce/configs/types";

export type SentryConfig = CE_SentryConfig;

export interface AppsmithUIConfigs extends CE_AppsmithUIConfigs {
  enableSamlOAuth: boolean;
  enableOidcOAuth: boolean;
}
