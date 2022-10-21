export * from "ce/pages/AdminSettings/config/general";
import {
  Setting,
  AdminConfigType,
} from "@appsmith/pages/AdminSettings/config/types";

import {
  config as CE_config,
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH__ADMIN_EMAILS_SETTING,
  APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING as CE_APPSMITH_HIDE_WATERMARK_SETTING,
} from "ce/pages/AdminSettings/config/general";

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  ...CE_APPSMITH_HIDE_WATERMARK_SETTING,
  needsUpgrade: false,
  isDisabled: () => false,
};

export const config: AdminConfigType = {
  ...CE_config,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH__ADMIN_EMAILS_SETTING,
    APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
  ],
} as AdminConfigType;
