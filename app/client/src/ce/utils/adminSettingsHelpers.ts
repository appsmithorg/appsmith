import { tenantConfigConnection } from "ee/constants/tenantConstants";
import type {
  AdminConfigType,
  Category,
} from "ee/pages/AdminSettings/config/types";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import type { User } from "constants/userConstants";

/* settings is the updated & unsaved settings on Admin settings page */
export const saveAllowed = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any,
  isFormLoginEnabled: boolean,
  socialLoginList: string[],
) => {
  const connectedMethodsCount =
    socialLoginList.length + (isFormLoginEnabled ? 1 : 0);
  if (connectedMethodsCount === 1) {
    const checkFormLogin =
        !("APPSMITH_FORM_LOGIN_DISABLED" in settings) && isFormLoginEnabled,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  { isSuperUser, tenantPermissions: any = [] }: Record<string, any>,
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

export const isTenantConfig = (name: string): boolean => {
  const fields: string[] = tenantConfigConnection;

  return fields.includes(name);
};

export const getWrapperCategory = (
  categories: Record<string, AdminConfigType>,
  subCategory: string,
  category: string,
) => {
  return categories[subCategory || category];
};

export const getFilteredGeneralCategories = (categories: Category[]) => {
  return categories
    ?.map((category: Category) => {
      return category;
    })
    .filter(Boolean);
};

export const getFilteredAclCategories = (
  categories: Category[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      return category;
    })
    .filter(Boolean);
};

export const getFilteredOtherCategories = (
  categories: Category[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      return category;
    })
    .filter(Boolean);
};
