import { LICENSE_CHECK_PATH } from "./../../constants/routes/baseRoutes";
export * from "ce/utils/signupHelpers";
import { firstTimeUserOnboardingInit } from "actions/onboardingActions";
import {
  SIGNUP_SUCCESS_URL,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
  APPLICATIONS_URL,
} from "constants/routes";
import { error } from "loglevel";
import { matchPath } from "react-router";
import { getIsSafeRedirectURL } from "utils/helpers";
import history from "utils/history";

// TODO: Try to refactor this function to make it more readable
export const redirectUserAfterSignup = (
  redirectUrl: string,
  shouldEnableFirstTimeUserOnboarding: string | null,
  validLicense?: boolean,
  dispatch?: any,
): any => {
  if (redirectUrl) {
    if (!validLicense) {
      history.replace(
        `${LICENSE_CHECK_PATH}?redirectUrl=${redirectUrl}&enableFirstTimeUserExperience=true`,
      );
    } else {
      try {
        if (
          window.location.pathname == SIGNUP_SUCCESS_URL &&
          shouldEnableFirstTimeUserOnboarding === "true"
        ) {
          let urlObject;
          try {
            urlObject = new URL(redirectUrl);
          } catch (e) {}
          const match = matchPath<{
            pageId: string;
            applicationId: string;
          }>(urlObject?.pathname ?? redirectUrl, {
            path: [
              BUILDER_PATH,
              BUILDER_PATH_DEPRECATED,
              VIEWER_PATH,
              VIEWER_PATH_DEPRECATED,
            ],
            strict: false,
            exact: false,
          });
          const { applicationId, pageId } = match?.params || {};
          if (applicationId || pageId) {
            dispatch(
              firstTimeUserOnboardingInit(applicationId, pageId as string),
            );
          }
        } else if (getIsSafeRedirectURL(redirectUrl)) {
          window.location.replace(redirectUrl);
        }
      } catch (e) {
        error("Error handling the redirect url", e);
      }
    }
  } else {
    history.replace(APPLICATIONS_URL);
  }
};
