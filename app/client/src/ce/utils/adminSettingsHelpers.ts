import { getAppsmithConfigs } from "@appsmith/configs";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import { User } from "constants/userConstants";

const { disableLoginForm } = getAppsmithConfigs();

/* settings is the updated & unsaved settings on Admin settings page */
export const saveAllowed = (settings: any, socialLoginList: string[]) => {
  const connectedMethodsCount =
    socialLoginList.length + (disableLoginForm ? 0 : 1);
  if (connectedMethodsCount === 1) {
    const checkFormLogin = !(
        "APPSMITH_FORM_LOGIN_DISABLED" in settings || disableLoginForm
      ),
      checkGoogleAuth =
        settings["APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"] !== "" &&
        socialLoginList.includes("google"),
      checkGithubAuth =
        settings["APPSMITH_OAUTH2_GITHUB_CLIENT_ID"] !== "" &&
        socialLoginList.includes("github");

    return checkFormLogin || checkGoogleAuth || checkGithubAuth;
  } else {
    return connectedMethodsCount >= 2;
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

export const getLoginUrl = (method: string): string => {
  const urls: Record<string, string> = {};

  return urls[method];
};
