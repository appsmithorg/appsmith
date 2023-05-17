export * from "ce/pages/AdminSettings/config/general";
import type {
  Setting,
  AdminConfigType,
} from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

import {
  config as CE_config,
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH__ADMIN_EMAILS_SETTING,
  APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING as CE_APPSMITH_HIDE_WATERMARK_SETTING,
  APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
} from "ce/pages/AdminSettings/config/general";

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  ...CE_APPSMITH_HIDE_WATERMARK_SETTING,
  needsUpgrade: false,
  isDisabled: () => false,
};

export const APPSMITH_SINGLE_USER_PER_SESSION_SETTING: Setting = {
  id: "APPSMITH_ENABLE_SINGLE_SESSION_PER_USER",
  name: "APPSMITH_ENABLE_SINGLE_SESSION_PER_USER",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "User Session Limit",
  text: "Limit users to a single active session",
};

const isAirgappedInstance = isAirgapped();

export const config: AdminConfigType = {
  ...CE_config,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH__ADMIN_EMAILS_SETTING,
    APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
    APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
    APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
  ].filter((setting) =>
    isAirgappedInstance ? setting !== APPSMITH_DISABLE_TELEMETRY_SETTING : true,
  ),
} as AdminConfigType;
