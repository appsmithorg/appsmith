export * from "ce/utils/adminSettingsHelpers";
import { saveAllowed as CE_saveAllowed } from "ce/utils/adminSettingsHelpers";
import type { User } from "constants/userConstants";
import {
  ADMIN_SETTINGS_CATEGORY_ACL_PATH,
  ADMIN_SETTINGS_CATEGORY_AUDIT_LOGS_PATH,
  ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH,
} from "constants/routes";
import {
  PERMISSION_TYPE,
  LOGIC_FILTER,
  isPermitted,
} from "@appsmith/utils/permissionHelpers";
import {
  OIDCOAuthURL,
  KeycloakOAuthURL,
  GoogleOAuthURL,
  GithubOAuthURL,
} from "@appsmith/constants/ApiConstants";
import type {
  AdminConfigType,
  Category,
} from "@appsmith/pages/AdminSettings/config/types";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

export const saveAllowed = (
  settings: any,
  isFormLoginEnabled: boolean,
  socialLoginList: string[],
) => {
  const connectedMethodsCount =
    socialLoginList.length + (isFormLoginEnabled ? 1 : 0);
  if (connectedMethodsCount === 1) {
    const checkOidcAuth =
      settings["APPSMITH_OAUTH2_OIDC_CLIENT_ID"] !== "" &&
      socialLoginList.includes("oidc");

    return (
      CE_saveAllowed(settings, isFormLoginEnabled, socialLoginList) ||
      checkOidcAuth ||
      socialLoginList.includes("saml")
    );
  } else {
    return connectedMethodsCount >= 2;
  }
};

export const getDefaultAdminSettingsPath = ({
  isSuperUser,
  tenantPermissions = [],
}: Record<string, any>): string => {
  const redirectToAuditLogs = isPermitted(
    tenantPermissions,
    PERMISSION_TYPE.READ_AUDIT_LOGS,
  );
  const redirectToGroups = isPermitted(
    tenantPermissions,
    [
      PERMISSION_TYPE.TENANT_READ_PERMISSION_GROUPS,
      PERMISSION_TYPE.TENANT_READ_USER_GROUPS,
    ],
    LOGIC_FILTER.OR,
  );
  if (isSuperUser) {
    return ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH;
  } else if (redirectToAuditLogs && !redirectToGroups) {
    return ADMIN_SETTINGS_CATEGORY_AUDIT_LOGS_PATH;
  } else {
    return ADMIN_SETTINGS_CATEGORY_ACL_PATH;
  }
};

export const showAdminSettings = (user?: User): boolean =>
  user?.adminSettingsVisible || false;

export const getLoginUrl = (method: string): string => {
  const urls: Record<string, string> = {
    oidc: OIDCOAuthURL,
    saml: KeycloakOAuthURL,
    google: GoogleOAuthURL,
    github: GithubOAuthURL,
  };

  return urls[method];
};

export const getWrapperCategory = (
  categories: Record<string, AdminConfigType>,
  subCategory: string,
  category: string,
) => {
  return categories[
    ["users", "groups", "roles"].includes(category)
      ? category
      : subCategory ?? category
  ];
};

export const getFilteredGeneralCategories = (categories: Category[]) => {
  const isAirgappedInstance = isAirgapped();
  return categories
    ?.map((category: Category) => {
      if (isAirgappedInstance && category.slug === "google-maps") {
        return null;
      }
      return category;
    })
    .filter(Boolean) as Category[];
};

export const getFilteredAclCategories = (
  categories: Category[],
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      if (
        (!isSuperUser && ["groups", "roles"].includes(category.slug)) ||
        isSuperUser
      ) {
        return category;
      }
      return null;
    })
    .filter(Boolean) as Category[];
};

export const getFilteredOtherCategories = (
  categories: Category[],
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      if (
        (!isSuperUser && ["audit-logs"].includes(category.slug)) ||
        isSuperUser
      ) {
        return category;
      }
      return null;
    })
    .filter(Boolean) as Category[];
};
