export * from "ce/utils/adminSettingsHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
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
