import { APPLICATIONS_URL } from "constants/routes";
import { error } from "loglevel";
import { getIsSafeRedirectURL } from "utils/helpers";
import history from "utils/history";

export const redirectUserAfterSignup = (redirectUrl: string): any => {
  if (redirectUrl) {
    try {
      if (getIsSafeRedirectURL(redirectUrl)) {
        window.location.replace(redirectUrl);
      }
    } catch (e) {
      error("Error handling the redirect url");
    }
  } else {
    history.replace(APPLICATIONS_URL);
  }
};
