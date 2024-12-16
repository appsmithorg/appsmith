import type { SupportedRampsType } from "./RampTypes";

export const RAMP_NAME = {
  INVITE_USER_TO_APP: "INVITE_USER_TO_APP",
  CUSTOM_ROLES: "CUSTOM_ROLES",
  PRIVATE_EMBED: "PRIVATE_EMBED",
  MULTIPLE_ENV: "MULTIPLE_ENV",
};

export const RAMP_FOR_ROLES = {
  SUPER_USER: "Super User",
  ADMIN: "Administrator",
  DEVELOPER: "Developer",
  APP_VIEWER: "App Viewer",
};

export enum RampSection {
  WorkspaceShare = "workspace_share",
  AppShare = "app_share",
  ShareModal = "share_modal",
  AppSettings = "app_settings",
  BottomBarEnvSwitcher = "bottom_bar_env_switcher",
  DSEditor = "ds_editor",
  AdminSettings = "admin_settings",
  PremiumDatasourcesContactModal = "premium_datasources_contact_modal",
}

export enum RampFeature {
  PrivateEmbeds = "private_embeds",
  Gac = "gac",
  MultipleEnv = "multiple_env",
  AuditLogs = "audit_logs",
  Branding = "branding",
  Sso = "sso",
  Provisioning = "provisioning",
  PremiumDatasources = "premium_datasources",
}

export const INVITE_USER_TO_APP: SupportedRampsType = {
  CLOUD_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: false,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: true,
  },
  SELF_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: true,
  },
};

export const CUSTOM_ROLES: SupportedRampsType = {
  CLOUD_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: false,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
  SELF_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
};
export const PRIVATE_EMBED: SupportedRampsType = {
  CLOUD_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: false,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
  SELF_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
};
export const MULTIPLE_ENV: SupportedRampsType = {
  CLOUD_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
  SELF_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
    [RAMP_FOR_ROLES.ADMIN]: true,
    [RAMP_FOR_ROLES.DEVELOPER]: true,
    [RAMP_FOR_ROLES.APP_VIEWER]: false,
  },
};
export const PRODUCT_RAMPS_LIST: { [key: string]: SupportedRampsType } = {
  [RAMP_NAME.INVITE_USER_TO_APP]: INVITE_USER_TO_APP,
  [RAMP_NAME.CUSTOM_ROLES]: CUSTOM_ROLES,
  [RAMP_NAME.PRIVATE_EMBED]: PRIVATE_EMBED,
  [RAMP_NAME.MULTIPLE_ENV]: MULTIPLE_ENV,
};
