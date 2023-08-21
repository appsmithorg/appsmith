import type { SupportedRampsType } from "./RampTypes";
import {
  CUSTOM_ROLES,
  INVITE_USER_TO_APP,
  MULTIPLE_ENV,
  RAMP_NAME,
} from "./RampsControlList";

export const PRODUCT_RAMPS_LIST: { [key: string]: SupportedRampsType } = {
  [RAMP_NAME.INVITE_USER_TO_APP]: INVITE_USER_TO_APP,
  [RAMP_NAME.CUSTOM_ROLES]: CUSTOM_ROLES,
  [RAMP_NAME.MULTIPLE_ENV]: MULTIPLE_ENV,
};
