import type { SupportedRampsType } from "./RampTypes";

export const RAMP_NAME = {
  INVITE_USER_TO_APP: "INVITE_USER_TO_APP",
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
