import { getAppsmithConfigs } from "@appsmith/configs";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import { User } from "constants/userConstants";
const {
  disableLoginForm,
  enableGithubOAuth,
  enableGoogleOAuth,
} = getAppsmithConfigs();

export const connectedMethods = [
  enableGoogleOAuth,
  enableGithubOAuth,
  !disableLoginForm,
].filter(Boolean);

/* settings is the updated & unsaved settings on Admin settings page */
export const saveAllowed = (settings: any) => {
  if (connectedMethods.length === 1) {
    const checkFormLogin = !(
        "APPSMITH_FORM_LOGIN_DISABLED" in settings || disableLoginForm
      ),
      checkGoogleAuth =
        settings["APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"] !== "" &&
        enableGoogleOAuth,
      checkGithubAuth =
        settings["APPSMITH_OAUTH2_GITHUB_CLIENT_ID"] !== "" &&
        enableGithubOAuth;

    return checkFormLogin || checkGoogleAuth || checkGithubAuth;
  } else {
    return connectedMethods.length >= 2;
  }
};

/* get default admin settings path */
export const getDefaultAdminSettingsPath = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { isSuperUser, tenantPermissions = [] }: Record<string, any>,
): string => {
  return ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH;
};

export const showAdminSettings = (user?: User): boolean => {
  return (user?.isSuperUser && user?.isConfigurable) || false;
};
