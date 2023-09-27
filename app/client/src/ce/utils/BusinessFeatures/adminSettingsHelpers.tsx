import type { User } from "constants/userConstants";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { showAdminSettings as showAdminSettings_CE } from "ce/utils/adminSettingsHelpers";
import { showAdminSettings as showAdminSettings_EE } from "@appsmith/utils/adminSettingsHelpers";

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
