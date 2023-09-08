export * from "ce/pages/AdminSettings/config/general";
import type {
  Setting,
  AdminConfigType,
} from "@appsmith/pages/AdminSettings/config/types";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

import {
  config as CE_config,
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH__ADMIN_EMAILS_SETTING,
  APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING as CE_APPSMITH_HIDE_WATERMARK_SETTING,
  APPSMITH_SINGLE_USER_PER_SESSION_SETTING as CE_APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING as CE_APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
} from "ce/pages/AdminSettings/config/general";

import { isBrandingEnabled } from "ce/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import {
  isProgramaticAccessControlEnabled,
  isUserSessionLimitEnabled,
} from "@appsmith/utils/planHelpers";
import store from "store";

const featureFlags = selectFeatureFlags(store.getState());
const isBrandingFFEnabled = isBrandingEnabled(featureFlags);
const isSessionLimitEnabled = isUserSessionLimitEnabled(featureFlags);
const isProgramaticAccessControlFFEnabled =
  isProgramaticAccessControlEnabled(featureFlags);

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  ...CE_APPSMITH_HIDE_WATERMARK_SETTING,
  isFeatureEnabled: isBrandingFFEnabled,
  isDisabled: () => !isBrandingFFEnabled,
};

export const APPSMITH_SINGLE_USER_PER_SESSION_SETTING: Setting = {
  ...CE_APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  isFeatureEnabled: isSessionLimitEnabled,
  isDisabled: () => !isSessionLimitEnabled,
};

export const APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING: Setting = {
  ...CE_APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  isFeatureEnabled: isProgramaticAccessControlFFEnabled,
  isDisabled: () => !isProgramaticAccessControlFFEnabled,
};

const isAirgappedInstance = isAirgapped();

const settings = [
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH__ADMIN_EMAILS_SETTING,
  APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING,
  APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
];

const removalSettings: Setting[] = [];

if (isAirgappedInstance) {
  removalSettings.push(APPSMITH_DISABLE_TELEMETRY_SETTING);
}

export const config: AdminConfigType = {
  ...CE_config,
  settings: settings.filter((item) => !removalSettings.includes(item)),
} as AdminConfigType;
