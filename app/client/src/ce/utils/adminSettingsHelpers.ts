import { getAppsmithConfigs } from "@appsmith/configs";
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

export const saveAllowed = (settings: any) => {
  if (
    connectedMethods.length >= 2 ||
    (connectedMethods.length === 1 &&
      ((!("APPSMITH_FORM_LOGIN_DISABLED" in settings) && !disableLoginForm) ||
        (settings["APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"] !== "" &&
          enableGoogleOAuth) ||
        (settings["APPSMITH_OAUTH2_GITHUB_CLIENT_ID"] !== "" &&
          enableGithubOAuth)))
  ) {
    return true;
  } else {
    return false;
  }
};
