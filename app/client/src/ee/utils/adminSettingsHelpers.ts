export * from "ce/utils/adminSettingsHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { User } from "constants/userConstants";
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
const {
  disableLoginForm,
  enableGithubOAuth,
  enableGoogleOAuth,
  enableOidcOAuth,
  enableSamlOAuth,
} = getAppsmithConfigs();

export const connectedMethods = [
  enableGoogleOAuth,
  enableGithubOAuth,
  enableOidcOAuth,
  enableSamlOAuth,
  !disableLoginForm,
].filter(Boolean);

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
        enableGithubOAuth,
      checkOidcAuth =
        settings["APPSMITH_OAUTH2_OIDC_CLIENT_ID"] !== "" && enableOidcOAuth;

    return (
      checkFormLogin ||
      checkGoogleAuth ||
      checkGithubAuth ||
      checkOidcAuth ||
      enableSamlOAuth
    );
  } else {
    return connectedMethods.length >= 2;
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
