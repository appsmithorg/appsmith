import type { User } from "constants/userConstants";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { showAdminSettings as showAdminSettings_CE } from "ce/utils/adminSettingsHelpers";
import { showAdminSettings as showAdminSettings_EE } from "ee/utils/adminSettingsHelpers";

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getDefaultAdminSettingsPath as getDefaultAdminSettingsPath_CE } from "ce/utils/adminSettingsHelpers";
import { getDefaultAdminSettingsPath as getDefaultAdminSettingsPath_EE } from "ee/utils/adminSettingsHelpers";

export const getShowAdminSettings = (
  isEnabled: boolean,
  user: User | undefined,
) => {
  if (isEnabled) {
    return showAdminSettings_EE(user);
  } else {
    return showAdminSettings_CE(user);
  }
};
export const getAdminSettingsPath = (
  isEnabled: boolean,
  isSuperUser: boolean,
  organizationPermissions: string[] = [],
) => {
  if (isEnabled) {
    return getDefaultAdminSettingsPath_EE({
      isSuperUser,
      organizationPermissions,
    });
  } else {
    return getDefaultAdminSettingsPath_CE({
      isSuperUser,
      organizationPermissions,
    });
  }
};
