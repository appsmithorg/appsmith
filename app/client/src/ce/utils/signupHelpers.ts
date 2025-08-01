import { setCurrentApplicationIdForCreateNewApp } from "actions/onboardingActions";
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
import type {
  SocialLoginButtonProps,
  SocialLoginType,
} from "ee/constants/SocialLogin";
import { SocialLoginButtonPropsList } from "ee/constants/SocialLogin";
import type { Dispatch } from "redux";

export interface RedirectUserAfterSignupProps {
  redirectUrl: string;
  shouldEnableFirstTimeUserOnboarding: string | null;
  validLicense?: boolean;
  dispatch: Dispatch;
  isAiAgentInstanceEnabled: boolean;
  isMultiOrgEnabled?: boolean;
  isOnLoginPage: boolean;
}

export const redirectUserAfterSignup = (
  props: RedirectUserAfterSignupProps,
) => {
  const {
    dispatch,
    isOnLoginPage,
    redirectUrl,
    shouldEnableFirstTimeUserOnboarding,
  } = props;

  if (redirectUrl) {
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
          basePageId: string;
          baseApplicationId: string;
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
        const { baseApplicationId, basePageId } = match?.params || {};

        /** ! Dev Note:
         *  setCurrentApplicationIdForCreateNewApp & firstTimeUserOnboardingInit
         *  in the following block support only applicationId
         *  but since baseId and id are same for applications created outside git context
         *  and since these redux actions are only called during onboarding,
         *  passing baseApplicationId as applicationId should be fine
         * **/
        if (baseApplicationId || basePageId) {
          dispatch(
            setCurrentApplicationIdForCreateNewApp(baseApplicationId as string),
          );
          history.replace(APPLICATIONS_URL);
        } else {
          if (!urlObject) {
            try {
              urlObject = new URL(redirectUrl, window.location.origin);
            } catch (e) {}
          }

          const newRedirectUrl = urlObject?.toString() || "";

          if (getIsSafeRedirectURL(newRedirectUrl)) {
            window.location.replace(newRedirectUrl);
          }
        }
      } else if (getIsSafeRedirectURL(redirectUrl)) {
        window.location.replace(redirectUrl);
      }
    } catch (e) {
      error("Error handling the redirect url");
    }
  } else {
    if (!isOnLoginPage) {
      history.replace(APPLICATIONS_URL);
    }
  }
};

export const getSocialLoginButtonProps = (
  logins: SocialLoginType[],
): SocialLoginButtonProps[] => {
  return logins.map((login) => {
    const socialLoginButtonProps = SocialLoginButtonPropsList[login];

    if (!socialLoginButtonProps) {
      throw Error("Social login not registered: " + login);
    }

    return socialLoginButtonProps;
  });
};
