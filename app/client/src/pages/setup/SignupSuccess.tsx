import { firstTimeUserOnboardingInit } from "actions/onboardingActions";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  extractAppIdAndPageIdFromUrl,
  SIGNUP_SUCCESS_URL,
} from "constants/routes";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "store";
import { getIsSafeRedirectURL } from "utils/helpers";
import history from "utils/history";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import Landing from "./Welcome";
import { error } from "loglevel";

export function SignupSuccess() {
  const dispatch = useDispatch();
  const urlObject = new URL(window.location.href);
  const redirectUrl = urlObject?.searchParams.get("redirectUrl");
  const shouldEnableFirstTimeUserOnboarding = urlObject?.searchParams.get(
    "enableFirstTimeUserExperience",
  );
  useEffect(() => {
    PerformanceTracker.stopTracking(PerformanceTransactionName.SIGN_UP);
  }, []);

  const redirectUsingQueryParam = useCallback(() => {
    if (redirectUrl) {
      try {
        if (
          window.location.pathname == SIGNUP_SUCCESS_URL &&
          shouldEnableFirstTimeUserOnboarding === "true"
        ) {
          const { applicationId, pageId } = extractAppIdAndPageIdFromUrl(
            redirectUrl,
          );
          if (applicationId && pageId) {
            dispatch(firstTimeUserOnboardingInit(applicationId, pageId));
          }
        } else if (getIsSafeRedirectURL(redirectUrl)) {
          window.location.replace(redirectUrl);
        }
      } catch (e) {
        error("Error handling the redirect url");
      }
    } else {
      history.replace(APPLICATIONS_URL);
    }
  }, []);

  const onGetStarted = useCallback((role?: string, useCase?: string) => {
    dispatch({
      type: ReduxActionTypes.UPDATE_USER_DETAILS_INIT,
      payload: {
        role,
        useCase,
      },
    });
    redirectUsingQueryParam();
  }, []);

  const user = useSelector(getCurrentUser);
  const { cloudHosting } = getAppsmithConfigs();
  const isCypressEnv = !!(window as any).Cypress;

  /*
   *  Proceed with redirection,
   *    For all local deployments
   *    For a super user, since we already collected role and useCase during signup
   *    For a normal user, who has filled in their role and useCase and try to visit signup-success url by entering manually.
   *    For an invited user, we don't want to collect the data. we just want to redirect to the org they have been invited to.
   *      We identify an invited user based on `enableFirstTimeUserExperience` flag in url.
   */
  //TODO(Balaji): Factor in case, where user had closed the tab, while filling the form.And logs back in again.
  if (
    (!cloudHosting && !isCypressEnv) ||
    user?.isSuperUser ||
    (user?.role && user?.useCase) ||
    shouldEnableFirstTimeUserOnboarding !== "true"
  ) {
    redirectUsingQueryParam();
  }
  return <Landing forSuperUser={false} onGetStarted={onGetStarted} />;
}

export default requiresAuth(SignupSuccess);
