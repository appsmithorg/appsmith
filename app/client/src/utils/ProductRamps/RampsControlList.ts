import type { SupportedRampsType } from "./RampTypes";

export const RAMP_NAME = {
  INVITE_USER_TO_APP: "INVITE_USER_TO_APP",
  CUSTOM_ROLES: "CUSTOM_ROLES",
};

export const RAMP_FOR_ROLES = {
  SUPER_USER: "Super User",
  ADMIN: "Administrator",
  DEVELOPER: "Developer",
  APP_VIEWER: "App Viewer",
};

export const INVITE_USER_TO_APP: SupportedRampsType = {
  CLOUD_HOSTED: {
    [RAMP_FOR_ROLES.SUPER_USER]: true,
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
};
